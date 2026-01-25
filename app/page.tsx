'use client';

import { useState, useRef } from 'react';
import InputForm from '@/components/InputForm';
import CalendarGrid from '@/components/CalendarGrid';
import Legend from '@/components/Legend';
import WeeklySummary from '@/components/WeeklySummary';
import ExportDropdown from '@/components/ExportDropdown';
import { ScheduleResponse } from '@/types/schedule';
import { getCachedResponse, setCachedResponse, saveLastInput } from '@/lib/cache';

export default function Home() {
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedCache, setUsedCache] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (input: string) => {
    console.log('📝 handleSubmit called with input:', input.substring(0, 50));
    setIsLoading(true);
    setError(null);
    setUsedCache(false);

    try {
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
                FlowWeek
              </h1>
            </div>
            <p className="text-[#787774] text-sm md:text-base font-medium ml-10 md:ml-[52px] animate-slide-up delay-75">
              Find your flow, every week
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
            {/* Export Button & Cache Indicator */}
            <div className="flex justify-between items-center gap-4 flex-shrink-0">
              {/* Cache Indicator - Shows when using cached result */}
              {usedCache && (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Loaded from cache (instant!)</span>
                </div>
              )}
              <div className="ml-auto">
                <ExportDropdown
                  scheduleData={scheduleData}
                  calendarRef={calendarRef}
                />
              </div>
            </div>

            {/* Calendar */}
            <div className="flex-1">
              <CalendarGrid scheduleData={scheduleData} exportRef={calendarRef} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
