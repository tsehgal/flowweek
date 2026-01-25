'use client';

import { useState, useRef } from 'react';
import InputForm from '@/components/InputForm';
import CalendarGrid from '@/components/CalendarGrid';
import Legend from '@/components/Legend';
import WeeklySummary from '@/components/WeeklySummary';
import ExportDropdown from '@/components/ExportDropdown';
import { ScheduleResponse } from '@/types/schedule';

export default function Home() {
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (input: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userInput: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate schedule');
      }

      const data = await response.json();
      setScheduleData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f4f5f7]">
      <div className="h-screen flex flex-col">
        {/* Header - Clean & Minimal */}
        <div className="relative bg-white border-b border-[#e9e9e7] overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>

          <div className="relative px-12 py-8">
            <div className="flex items-center gap-3 mb-2 animate-slide-up">
              {/* Logo icon */}
              <div className="w-10 h-10 bg-gradient-to-br from-[#2383e2] to-[#1a6dc4] rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v5m0-5l2 2m-2-2l-2 2" />
                </svg>
              </div>
              <h1 className="text-4xl font-bold text-[#272626] tracking-tight">
                FlowWeek
              </h1>
            </div>
            <p className="text-[#787774] text-base font-medium ml-[52px] animate-slide-up delay-75">
              Find your flow, every week
            </p>
          </div>
        </div>

        {/* Main Content - Side by Side */}
        <div className="flex-1 flex gap-6 px-8 py-8 overflow-hidden">
          {/* Left Column - Input Form */}
          <div className="w-[380px] flex-shrink-0 flex flex-col gap-4 overflow-y-auto pb-4">
            <div
              className="bg-white rounded-xl border border-[#e9e9e7] p-6 transition-all duration-300 animate-slide-up flex-shrink-0"
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
              <div className="animate-slide-up delay-150 flex-shrink-0 mb-4">
                <WeeklySummary goals={scheduleData.weeklyGoals} />
              </div>
            )}
          </div>

          {/* Right Column - Calendar */}
          <div className="flex-1 flex flex-col gap-4 animate-scale-in delay-150">
            {/* Export Button - Top Right */}
            <div className="flex justify-end">
              <ExportDropdown
                scheduleData={scheduleData}
                calendarRef={calendarRef}
              />
            </div>

            {/* Calendar */}
            <div className="flex-1 overflow-auto">
              <CalendarGrid scheduleData={scheduleData} exportRef={calendarRef} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
