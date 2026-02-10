'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import InputForm from '@/components/InputForm';
import CalendarGrid from '@/components/CalendarGrid';
import Legend from '@/components/Legend';
import WeeklySummary from '@/components/WeeklySummary';
import ExportDropdown from '@/components/ExportDropdown';
import EditModeToggle from '@/components/EditModeToggle';
import ActivityModal from '@/components/ActivityModal';
import { ScheduleResponse, EditableActivity } from '@/types/schedule';
import { getCachedResponse, setCachedResponse, saveLastInput, getEditedSchedule, saveEditedSchedule, clearEditedSchedule } from '@/lib/cache';
import { normalizeActivities, denormalizeActivities } from '@/lib/utils';

export default function Home() {
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedCache, setUsedCache] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Edit mode state
  const [editedActivities, setEditedActivities] = useState<EditableActivity[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentInputHash, setCurrentInputHash] = useState<string>('');
  const [editModalActivity, setEditModalActivity] = useState<EditableActivity | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Determine if schedule has been edited
  const isEdited = editedActivities.length > 0;

  // Extract unique categories from schedule for the modal
  const getUniqueCategories = useCallback(() => {
    const activities = editedActivities.length > 0 ? editedActivities : scheduleData?.activities || [];
    const categoryMap = new Map<string, { name: string; color: string; icon: string }>();

    activities.forEach((activity) => {
      if (!categoryMap.has(activity.category)) {
        // Get icon from CalendarGrid's getCategoryIcon logic
        const icon = getCategoryIcon(activity.category);
        categoryMap.set(activity.category, {
          name: activity.category,
          color: activity.color,
          icon,
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [editedActivities, scheduleData]);

  // Helper to get category icon (matching CalendarGrid logic)
  const getCategoryIcon = (category: string): string => {
    const normalized = category.toLowerCase().replace(/[-_]/g, ' ').trim();
    if (normalized.match(/gym|workout|exercise|fitness/)) return '💪';
    if (normalized.match(/yoga|meditation/)) return '🧘';
    if (normalized.match(/run|jog/)) return '🏃';
    if (normalized.match(/\bai\b|artificial|machine.*learning|ml\b/)) return '🧠';
    if (normalized.match(/brain|dump|journal|reflect/)) return '🧠';
    if (normalized.match(/learn|study|course|education/)) return '📚';
    if (normalized.match(/read/)) return '📖';
    if (normalized.match(/job|application|apply|career|resume|interview/)) return '💼';
    if (normalized.match(/work|office/)) return '💻';
    if (normalized.match(/meeting/)) return '👥';
    if (normalized.match(/guitar|music/)) return '🎸';
    if (normalized.match(/art|paint|draw/)) return '🎨';
    if (normalized.match(/write|writing/)) return '✍️';
    if (normalized.match(/simmer|newsletter/)) return '✨';
    if (normalized.match(/family|kids/)) return '👨‍👩‍👧';
    if (normalized.match(/sleep|rest/)) return '😴';
    if (normalized.match(/meal|breakfast|lunch|dinner|eat/)) return '🍽️';
    if (normalized.match(/cook/)) return '🍳';
    if (normalized.match(/commute|travel|drive/)) return '🚗';
    if (normalized.match(/project|side/)) return '🚀';
    if (normalized.match(/app|coding|dev/)) return '💻';
    return '📌';
  };

  // Generate hash for input (same logic as cache.ts)
  const generateInputHash = useCallback((input: string): string => {
    let hash = 0;
    const str = input.trim().toLowerCase();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }, []);

  // Load edited schedule from localStorage when schedule data changes
  useEffect(() => {
    if (scheduleData) {
      const hash = currentInputHash;
      const edited = getEditedSchedule(hash);
      if (edited && edited.length > 0) {
        setEditedActivities(edited);
        console.log('✅ Loaded edited activities from localStorage');
      } else {
        // No cached edits - clear edited activities
        setEditedActivities([]);
        setIsEditMode(false);
      }
    }
  }, [scheduleData, currentInputHash]);

  // Auto-save edited activities with debounce
  useEffect(() => {
    if (editedActivities.length > 0 && currentInputHash) {
      const timeoutId = setTimeout(() => {
        saveEditedSchedule(currentInputHash, editedActivities);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [editedActivities, currentInputHash]);

  const handleSubmit = async (input: string) => {
    console.log('📝 handleSubmit called with input:', input.substring(0, 50));
    setIsLoading(true);
    setError(null);
    setUsedCache(false);

    try {
      // Generate and save input hash
      const hash = generateInputHash(input);
      setCurrentInputHash(hash);

      // Save input for persistence (production feature!)
      console.log('💾 About to save input to localStorage...');
      saveLastInput(input);

      // Check cache first (works in ALL environments)
      const cachedData = getCachedResponse(input);
      if (cachedData) {
        setScheduleData(cachedData);
        setUsedCache(true);
        setIsLoading(false);
        return;
      }

      // Make API call
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate schedule');
      }

      const data = await response.json();

      // Cache the response (production feature!)
      setCachedResponse(input, data);

      setScheduleData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  // Edit mode handlers
  const handleToggleEditMode = () => {
    const newEditMode = !isEditMode;
    setIsEditMode(newEditMode);

    // When entering edit mode for the first time, initialize edited activities
    // with normalized version of current schedule
    if (newEditMode && editedActivities.length === 0 && scheduleData?.activities) {
      const normalized = normalizeActivities(scheduleData.activities);
      setEditedActivities(normalized);
      console.log('📋 Initialized edit mode with', normalized.length, 'activities');
    }
  };

  const handleResetToOriginal = () => {
    if (currentInputHash) {
      clearEditedSchedule(currentInputHash);
      setEditedActivities([]);
      setIsEditMode(false);
    }
  };

  const handleActivitySave = (activity: EditableActivity) => {
    setEditedActivities((prev) => {
      // If editing existing activity, replace it
      const existingIndex = prev.findIndex((a) => a.id === activity.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = activity;
        return updated;
      }
      // Otherwise, add new activity
      return [...prev, activity];
    });
    setIsEditModalOpen(false);
    setEditModalActivity(null);
  };

  const handleActivityDelete = (id: string) => {
    setEditedActivities((prev) => prev.filter((a) => a.id !== id));
    setIsEditModalOpen(false);
    setEditModalActivity(null);
  };

  const handleAddActivity = () => {
    setEditModalActivity(null);
    setIsEditModalOpen(true);
  };

  const handleEditActivity = (activity: EditableActivity) => {
    setEditModalActivity(activity);
    setIsEditModalOpen(true);
  };

  const handleActivityMove = (activityId: string, newDay: string) => {
    setEditedActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? { ...activity, day: newDay }
          : activity
      )
    );
    console.log(`📍 Moved activity ${activityId} to ${newDay}`);
  };

  const handleActivityResize = (activityId: string, newStartTime: string, newEndTime: string) => {
    setEditedActivities((prev) =>
      prev.map((activity) =>
        activity.id === activityId
          ? { ...activity, startTime: newStartTime, endTime: newEndTime }
          : activity
      )
    );
    console.log(`⏱️ Resized activity ${activityId}: ${newStartTime} - ${newEndTime}`);
  };

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <div className="min-h-screen flex flex-col">
        {/* Header - Clean & Minimal */}
        <div className="relative bg-white border-b border-[#e9e9e7] overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>

          <div className="relative px-4 md:px-12 py-4 md:py-8">
            <div className="flex items-center gap-2 md:gap-3 mb-1 md:mb-2 animate-slide-up">
              {/* Logo icon */}
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-[#2383e2] to-[#1a6dc4] rounded-lg md:rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v5m0-5l2 2m-2-2l-2 2" />
                </svg>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-[#272626] tracking-tight">
                MakeTime
              </h1>
            </div>
            <p className="text-[#787774] text-sm md:text-base font-medium ml-10 md:ml-[52px] animate-slide-up delay-75">
              Make time for what matters
            </p>
          </div>
        </div>

        {/* Main Content - Side by Side on Desktop, Stacked on Mobile */}
        <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 px-4 md:px-8 py-4 md:py-8 md:overflow-hidden">
          {/* Left Column - Input Form */}
          <div className="w-full md:w-[380px] flex-shrink-0 flex flex-col gap-4 md:max-h-full md:overflow-y-auto pb-4">
            <div
              className="bg-white rounded-xl border border-[#e9e9e7] p-4 md:p-6 transition-all duration-300 animate-slide-up flex-shrink-0"
              style={{ boxShadow: '0 12px 24px rgba(0, 0, 0, 0.06)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.06)';
              }}
            >
              <InputForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                error={error}
              />
            </div>
            <div className="animate-slide-up delay-75 flex-shrink-0">
              <Legend scheduleData={scheduleData} />
            </div>
            {scheduleData && scheduleData.weeklyGoals.length > 0 && (
              <div className="animate-slide-up delay-150 flex-shrink-0">
                <WeeklySummary goals={scheduleData.weeklyGoals} />
              </div>
            )}
          </div>

          {/* Right Column - Calendar */}
          <div className="flex-1 flex flex-col gap-4 animate-scale-in delay-150 md:overflow-hidden">
            {/* Edit Mode Toggle, Export Button & Cache Indicator */}
            <div className="flex justify-between items-center gap-4 flex-shrink-0 flex-wrap">
              {/* Cache Indicator - Shows when using cached result */}
              {usedCache && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Loaded from cache (instant!)</span>
                </div>
              )}

              {/* Edit Mode Toggle */}
              {scheduleData && (
                <EditModeToggle
                  isEditMode={isEditMode}
                  isEdited={isEdited}
                  onToggle={handleToggleEditMode}
                  onReset={handleResetToOriginal}
                />
              )}

              <div className="ml-auto flex items-center gap-3">
                {/* Add Activity Button */}
                {isEditMode && scheduleData && (
                  <button
                    onClick={handleAddActivity}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Activity
                  </button>
                )}

                {/* Export Dropdown */}
                <ExportDropdown
                  scheduleData={scheduleData}
                  calendarRef={calendarRef}
                  editedActivities={editedActivities}
                />
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1">
              <CalendarGrid
                scheduleData={scheduleData}
                exportRef={calendarRef}
                editedActivities={editedActivities}
                isEditMode={isEditMode}
                onEditActivity={handleEditActivity}
                onActivityMove={handleActivityMove}
                onActivityResize={handleActivityResize}
              />
            </div>
          </div>
        </div>

        {/* Activity Modal */}
        {isEditModalOpen && (
          <ActivityModal
            activity={editModalActivity}
            onSave={handleActivitySave}
            onDelete={handleActivityDelete}
            onClose={() => {
              setIsEditModalOpen(false);
              setEditModalActivity(null);
            }}
            existingCategories={getUniqueCategories()}
          />
        )}
      </div>
    </main>
  );
}
