'use client';

import { ScheduleResponse } from '@/types/schedule';
import { useMemo } from 'react';

interface LegendProps {
  scheduleData?: ScheduleResponse | null;
}

// Default icon mapping based on common category names
const getIconForCategory = (category: string): string => {
  const categoryLower = category.toLowerCase();

  // Common category icon mappings
  const iconMap: Record<string, string> = {
    gym: '💪',
    workout: '💪',
    exercise: '💪',
    fitness: '💪',
    learning: '🧠',
    study: '📚',
    'ai-learning': '🧠',
    work: '💻',
    office: '💻',
    job: '💼',
    'job-apps': '💼',
    'job-search': '💼',
    family: '👨‍👩‍👧',
    sleep: '😴',
    rest: '😴',
    breakfast: '🍳',
    lunch: '🍽️',
    dinner: '🍽️',
    meal: '🍽️',
    commute: '🚗',
    travel: '✈️',
    music: '🎵',
    guitar: '🎸',
    hobby: '🎨',
    project: '🚀',
    'side-project': '🚀',
    personal: '✨',
    meditation: '🧘',
    yoga: '🧘',
    reading: '📖',
    writing: '✍️',
    podcast: '🎙️',
    meeting: '🤝',
    cooking: '👨‍🍳',
  };

  // Check for exact match first
  if (iconMap[categoryLower]) {
    return iconMap[categoryLower];
  }

  // Check for partial matches
  for (const [key, icon] of Object.entries(iconMap)) {
    if (categoryLower.includes(key)) {
      return icon;
    }
  }

  // Default icon
  return '📌';
};

export default function Legend({ scheduleData }: LegendProps) {
  // Extract unique categories from schedule data
  const categories = useMemo(() => {
    if (!scheduleData || !scheduleData.activities.length) {
      return [];
    }

    const categoryMap = new Map<string, { name: string; color: string; icon: string }>();

    scheduleData.activities.forEach((activity) => {
      if (!categoryMap.has(activity.category)) {
        categoryMap.set(activity.category, {
          name: activity.category
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          color: activity.color,
          icon: getIconForCategory(activity.category),
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [scheduleData]);

  return (
    <div
      className="bg-white rounded-xl border border-[#e9e9e7] p-5 transition-all duration-300"
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
      <h3 className="text-sm font-semibold text-[#272626] mb-3">
        Categories
      </h3>
      {categories.length === 0 ? (
        <p className="text-xs text-[#787774] italic">
          Categories will appear here after generating a schedule
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {categories.map((category) => (
            <div
              key={category.name}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f4f5f7] rounded-md hover:bg-[#e9e9e7] hover:scale-105 transition-all duration-300 cursor-default"
            >
              <span className="text-xs leading-none">{category.icon}</span>
              <div
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: category.color }}
              />
              <span className="text-[11px] font-normal text-[#272626]">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
