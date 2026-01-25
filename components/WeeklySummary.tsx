'use client';

import { WeeklyGoal } from '@/types/schedule';

interface WeeklySummaryProps {
  goals: WeeklyGoal[];
}

export default function WeeklySummary({ goals }: WeeklySummaryProps) {
  if (!goals || goals.length === 0) return null;

  return (
    <div
      className="bg-white rounded-xl border border-[#e9e9e7] p-4 transition-all duration-300"
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
      <h3 className="text-sm md:text-base font-semibold text-[#272626] mb-3">
        Weekly Goals
      </h3>
      <div className="space-y-2.5">
        {goals.map((goal, idx) => (
          <div
            key={idx}
            className="bg-[#f4f5f7] p-3 rounded-lg border border-[#e9e9e7] transition-all duration-300 cursor-default"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(35, 131, 226, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = '#e9e9e7';
            }}
          >
            <h4 className="font-semibold text-[#272626] text-sm mb-1.5">
              {goal.name}
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-base md:text-lg font-bold text-[#272626]">
                {goal.targetMinutes}
              </span>
              <span className="text-xs font-normal text-[#787774]">mins</span>
              <span className="text-xs text-[#787774]">
                ({(goal.targetMinutes / 60).toFixed(1)} hrs)
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-xs font-normal text-[#787774] capitalize">
                {goal.category.replace('-', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
