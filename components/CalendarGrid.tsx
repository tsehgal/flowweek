'use client';

import React from 'react';
import { ScheduleResponse } from '@/types/schedule';
import {
  timeToMinutes,
  minutesToGridRow,
  formatTimeDisplay,
  getCurrentDay,
  generateTimeSlots,
} from '@/lib/utils';
import { mockData } from '@/lib/mockData';

interface CalendarGridProps {
  scheduleData: ScheduleResponse | null;
  currentDay?: string;
  exportRef?: React.RefObject<HTMLDivElement | null>;
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
}: CalendarGridProps) {
  const timeSlots = generateTimeSlots();
  const today = currentDay || getCurrentDay();
  const data = scheduleData || mockData; // Use mock data if no schedule provided

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

  // Helper to get category class name
  const getCategoryClass = (category: string): string => {
    const categoryMap: Record<string, string> = {
      gym: 'bg-gym',
      'ai-learning': 'bg-ai-learning',
      simmer: 'bg-simmer',
      'job-apps': 'bg-job-apps',
      guitar: 'bg-guitar',
      office: 'bg-office',
      family: 'bg-family',
      sleep: 'bg-sleep',
      breakfast: 'bg-breakfast',
      commute: 'bg-commute',
    };
    return categoryMap[category] || 'bg-gray-200';
  };

  // Helper to get category icon/emoji
  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      gym: '💪',
      'ai-learning': '🧠',
      simmer: '✨',
      'job-apps': '💼',
      guitar: '🎸',
      office: '💻',
      family: '👨‍👩‍👧',
      sleep: '😴',
      breakfast: '🍳',
      commute: '🚗',
    };
    return iconMap[category] || '📌';
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
        {/* Calendar Grid */}
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
              ...DAYS.map((day, dayIdx) => (
                <div
                  key={`${day}-${time}`}
                  className={`border-b border-l border-[#e9e9e7]/50 relative ${
                    day === today ? 'bg-[#2383e2]/5' : ''
                  }`}
                  style={{ gridRow: rowNumber, gridColumn: dayIdx + 2 }}
                />
              ))
            ];
          })}

          {/* Activity blocks - positioned absolutely within grid */}
          {data.activities.map((activity) =>
            activity.days.map((day) => {
              const dayIndex = DAYS.indexOf(day);
              if (dayIndex === -1) return null;

              const style = getActivityStyle(
                activity.startTime,
                activity.endTime
              );
              const categoryClass = getCategoryClass(activity.category);

              const duration = calculateDuration(
                activity.startTime,
                activity.endTime
              );
              const icon = getCategoryIcon(activity.category);

              return (
                <div
                  key={`${activity.id}-${day}`}
                  className={`${categoryClass} border border-gray-900/10 rounded-lg p-2.5 overflow-hidden cursor-pointer group relative`}
                  style={{
                    gridColumn: dayIndex + 2, // +2 for time column offset
                    gridRowStart: style.gridRowStart,
                    gridRowEnd: style.gridRowEnd,
                    margin: '3px 4px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(35, 131, 226, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
                  }}
                >
                  <div className="flex items-start gap-1.5 mb-1">
                    <span className="text-sm leading-none">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-[#272626] leading-tight group-hover:text-[#2383e2] transition-colors duration-300">
                        {activity.name}
                      </div>
                    </div>
                    <div className="text-[9px] font-semibold text-[#787774] whitespace-nowrap bg-white/80 px-1.5 py-0.5 rounded">
                      {duration}
                    </div>
                  </div>
                  <div className="text-[9px] font-normal text-[#787774] leading-tight ml-[22px]">
                    {formatTimeDisplay(activity.startTime)} -{' '}
                    {formatTimeDisplay(activity.endTime)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
