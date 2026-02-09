'use client';

import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, pointerWithin } from '@dnd-kit/core';
import { ScheduleResponse, EditableActivity } from '@/types/schedule';
import {
  timeToMinutes,
  minutesToGridRow,
  formatTimeDisplay,
  getCurrentDay,
  generateTimeSlots,
  normalizeActivities,
} from '@/lib/utils';
import { mockData } from '@/lib/mockData';
import DraggableActivity from './DraggableActivity';
import DroppableCell from './DroppableCell';

interface CalendarGridProps {
  scheduleData: ScheduleResponse | null;
  currentDay?: string;
  exportRef?: React.RefObject<HTMLDivElement | null>;
  editedActivities?: EditableActivity[];
  isEditMode?: boolean;
  onEditActivity?: (activity: EditableActivity) => void;
  onActivityMove?: (activityId: string, newDay: string) => void;
  onActivityResize?: (activityId: string, newStartTime: string, newEndTime: string) => void;
}

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function CalendarGrid({
  scheduleData,
  currentDay,
  exportRef,
  editedActivities = [],
  isEditMode = false,
  onEditActivity,
  onActivityMove,
  onActivityResize,
}: CalendarGridProps) {
  const timeSlots = generateTimeSlots();
  const today = currentDay || getCurrentDay();
  const data = scheduleData || mockData; // Use mock data if no schedule provided
  const [animationKey, setAnimationKey] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Get activities to display (edited or original)
  const getDisplayActivities = (): EditableActivity[] => {
    if (editedActivities.length > 0) {
      return editedActivities;
    }
    if (data?.activities) {
      return normalizeActivities(data.activities);
    }
    return [];
  };

  const displayActivities = getDisplayActivities();

  // Trigger animation when schedule data changes
  useEffect(() => {
    if (scheduleData) {
      setAnimationKey((prev) => prev + 1);
    }
  }, [scheduleData]);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;
    setActiveId(null);

    if (!over) return;

    const activityId = active.id.toString();
    const activity = displayActivities.find(a => a.id === activityId);
    if (!activity) return;

    // Extract day and time slot from droppable ID (format: "droppable-Monday-0")
    const overId = over.id.toString();
    const match = overId.match(/droppable-(\w+)-(\d+)/);

    if (match) {
      const newDay = match[1];
      const timeSlotIndex = parseInt(match[2]);

      let hasChanges = false;

      // Check if day changed (horizontal drag)
      if (activity.day !== newDay && onActivityMove) {
        hasChanges = true;
      }

      // Check if time changed (vertical drag)
      // Calculate new start time based on drop position
      // Each time slot is 30 minutes, starting at 3:30 AM (210 minutes)
      const newStartMinutes = 210 + (timeSlotIndex * 30);

      // Calculate current start time
      const currentStartMinutes = timeToMinutes(activity.startTime);
      const duration = timeToMinutes(activity.endTime) - currentStartMinutes;

      // Only update time if there's a significant vertical movement
      if (Math.abs(newStartMinutes - currentStartMinutes) >= 30 && onActivityResize) {
        const newEndMinutes = newStartMinutes + duration;

        // Validate bounds
        if (newStartMinutes >= 210 && newEndMinutes <= 1320) {
          const newStartTime = minutesToTime(newStartMinutes);
          const newEndTime = minutesToTime(newEndMinutes);

          // Update both day and time
          if (hasChanges && onActivityMove) {
            // First move to new day
            onActivityMove(activityId, newDay);
          }
          // Then update time
          if (onActivityResize) {
            onActivityResize(activityId, newStartTime, newEndTime);
          }
          return;
        }
      }

      // If only day changed, just move
      if (hasChanges && activity.day !== newDay && onActivityMove) {
        onActivityMove(activityId, newDay);
      }
    }
  };

  // Helper functions for time conversion
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  if (!data) {
    return (
      <div
        className="bg-white rounded-xl border border-[#e9e9e7] p-16 text-center h-full flex items-center justify-center transition-all duration-300"
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
        <div className="max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#2383e2]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#2383e2]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[#272626] mb-2">
            Your schedule awaits
          </h3>
          <p className="text-[#787774] text-sm">
            Describe your weekly goals to generate a visual time-blocked schedule
          </p>
        </div>
      </div>
    );
  }

  // Helper to get category icon/emoji based on category name
  const getCategoryIcon = (category: string): string => {
    // Normalize: lowercase and replace hyphens/underscores with spaces
    const normalized = category.toLowerCase().replace(/[-_]/g, ' ').trim();

    console.log('Category matching:', category, '→', normalized); // Debug log

    // Exercise & Fitness
    if (normalized.match(/gym|workout|exercise|fitness/)) return '💪';
    if (normalized.match(/yoga|meditation/)) return '🧘';
    if (normalized.match(/run|jog/)) return '🏃';

    // Learning & Development (check AI first before generic learning)
    if (normalized.match(/\bai\b|artificial|machine.*learning|ml\b/)) return '🧠';
    if (normalized.match(/brain|dump|journal|reflect/)) return '🧠';
    if (normalized.match(/learn|study|course|education/)) return '📚';
    if (normalized.match(/read/)) return '📖';

    // Work & Career
    if (normalized.match(/job|application|apply|career|resume|interview/)) return '💼';
    if (normalized.match(/work|office/)) return '💻';
    if (normalized.match(/meeting/)) return '👥';

    // Creative & Hobbies
    if (normalized.match(/guitar|music/)) return '🎸';
    if (normalized.match(/art|paint|draw/)) return '🎨';
    if (normalized.match(/write|writing/)) return '✍️';
    if (normalized.match(/simmer|newsletter/)) return '✨';

    // Personal & Life
    if (normalized.match(/family|kids/)) return '👨‍👩‍👧';
    if (normalized.match(/sleep|rest/)) return '😴';
    if (normalized.match(/meal|breakfast|lunch|dinner|eat/)) return '🍽️';
    if (normalized.match(/cook/)) return '🍳';

    // Transportation
    if (normalized.match(/commute|travel|drive/)) return '🚗';

    // Projects
    if (normalized.match(/project|side/)) return '🚀';
    if (normalized.match(/app|coding|dev/)) return '💻';

    // Default
    console.warn('No emoji match found for category:', category);
    return '📌';
  };

  // Calculate activity position and height
  const getActivityStyle = (startTime: string, endTime: string) => {
    const startMinutes = timeToMinutes(startTime);
    let endMinutes = timeToMinutes(endTime);

    // Handle midnight-spanning activities (e.g., sleep from 21:30 to 03:30)
    // For display, we'll show the portion within our visible range (03:30 to 22:00)
    if (endMinutes < startMinutes) {
      // Activity spans midnight - cap at 22:00 (1320 minutes) for display
      endMinutes = 1320; // 10:00 PM
    }

    // Calculate grid position: each 30-min slot starting from 3:30 AM (210 minutes)
    const gridRowStart = Math.floor((startMinutes - 210) / 30) + 2;
    const gridRowEnd = Math.ceil((endMinutes - 210) / 30) + 2;

    return {
      gridRowStart,
      gridRowEnd,
    };
  };

  // Calculate duration in human-readable format
  const calculateDuration = (startTime: string, endTime: string): string => {
    const startMinutes = timeToMinutes(startTime);
    let endMinutes = timeToMinutes(endTime);

    // Handle midnight-spanning activities
    if (endMinutes < startMinutes) {
      endMinutes = 1320; // Cap at 10:00 PM for display
    }

    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  const calendarContent = (
    <div
      className="grid gap-0 bg-white rounded-xl overflow-hidden min-w-[600px] md:min-w-0 w-max"
      style={{
        gridTemplateColumns: '50px repeat(7, minmax(80px, 1fr))',
        gridTemplateRows: `36px repeat(${timeSlots.length}, 32px)`,
      }}
    >
          {/* Header Row */}
          <div className="border-b border-[#e9e9e7] bg-[#f4f5f7] sticky left-0 z-10" />
          {DAYS.map((day) => (
            <div
              key={day}
              className={`border-b border-l border-[#e9e9e7] px-1 md:px-2 py-2 text-center font-semibold text-[10px] md:text-xs ${
                day === today
                  ? 'bg-[#2383e2]/5 text-[#2383e2]'
                  : 'bg-[#f4f5f7] text-[#272626]'
              }`}
            >
              <div className="uppercase tracking-wide">{day.slice(0, 3)}</div>
              {day === today && (
                <div className="mt-0.5 hidden md:block">
                  <span className="inline-block px-1.5 py-0.5 bg-[#2383e2] text-white text-[9px] font-medium rounded">
                    Today
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Time slots and grid cells - with explicit row positioning */}
          {timeSlots.flatMap((time, idx) => {
            const rowNumber = idx + 2; // +2 for header row
            return [
              // Time label
              <div
                key={`time-${time}`}
                className="border-b border-[#e9e9e7]/50 px-2 py-0.5 text-[10px] font-normal text-[#787774] flex items-center sticky left-0 bg-[#f4f5f7] z-10 border-r border-[#e9e9e7]"
                style={{ gridRow: rowNumber, gridColumn: 1 }}
              >
                {formatTimeDisplay(time)}
              </div>,
              // Day columns
              ...DAYS.map((day, dayIdx) => {
                const cellId = `droppable-${day}-${idx}`;
                return isEditMode ? (
                  <DroppableCell
                    key={cellId}
                    id={cellId}
                    day={day}
                    time={time}
                    isToday={day === today}
                    rowNumber={rowNumber}
                    columnNumber={dayIdx + 2}
                  />
                ) : (
                  <div
                    key={`${day}-${time}`}
                    className={`border-b border-l border-[#e9e9e7]/50 relative ${
                      day === today ? 'bg-[#2383e2]/5' : ''
                    }`}
                    style={{ gridRow: rowNumber, gridColumn: dayIdx + 2 }}
                  />
                );
              })
            ];
          })}

          {/* Activity blocks - positioned absolutely within grid */}
          {displayActivities.map((activity, activityIndex) => {
            const dayIndex = DAYS.indexOf(activity.day);
            if (dayIndex === -1) return null;

            const style = getActivityStyle(
              activity.startTime,
              activity.endTime
            );

            const duration = calculateDuration(
              activity.startTime,
              activity.endTime
            );
            const icon = getCategoryIcon(activity.category);

            // Calculate staggered animation delay
            const animationDelay = activityIndex * 100; // 100ms between each block

            return (
              <DraggableActivity
                key={`${activity.id}-${animationKey}`}
                activity={activity}
                icon={icon}
                duration={duration}
                gridColumn={dayIndex + 2}
                gridRowStart={style.gridRowStart}
                gridRowEnd={style.gridRowEnd}
                animationDelay={animationDelay}
                isEditMode={isEditMode}
                onEdit={(act) => onEditActivity && onEditActivity(act)}
                onResize={onActivityResize}
              />
            );
          })}
    </div>
  );

  return (
    <div
      ref={exportRef}
      className="bg-white rounded-xl border border-[#e9e9e7] h-auto md:h-full flex flex-col transition-all duration-300"
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
      <div className="flex-1 overflow-x-auto overflow-y-visible md:overflow-auto">
        {/* Wrap calendar grid in DndContext when in edit mode */}
        {isEditMode ? (
          <DndContext
            onDragEnd={handleDragEnd}
            onDragStart={(event) => setActiveId(event.active.id.toString())}
            collisionDetection={pointerWithin}
          >
            {calendarContent}
          </DndContext>
        ) : (
          calendarContent
        )}
      </div>
    </div>
  );
}
