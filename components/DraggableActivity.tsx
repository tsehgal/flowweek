'use client';

import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { EditableActivity } from '@/types/schedule';
import { formatTimeDisplay } from '@/lib/utils';
import ResizeHandle from './ResizeHandle';

interface DraggableActivityProps {
  activity: EditableActivity;
  icon: string;
  duration: string;
  gridColumn: number;
  gridRowStart: number;
  gridRowEnd: number;
  animationDelay: number;
  isEditMode: boolean;
  onEdit: (activity: EditableActivity) => void;
  onResize?: (activityId: string, newStartTime: string, newEndTime: string) => void;
}

export default function DraggableActivity({
  activity,
  icon,
  duration,
  gridColumn,
  gridRowStart,
  gridRowEnd,
  animationDelay,
  isEditMode,
  onEdit,
  onResize,
}: DraggableActivityProps) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDelta, setResizeDelta] = useState({ top: 0, bottom: 0 });

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
    disabled: !isEditMode || isResizing, // Disable dragging when resizing
    data: {
      activity,
    },
  });

  // Convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Handle resize from top handle
  const handleTopResize = (deltaMinutes: number) => {
    setResizeDelta((prev) => ({ ...prev, top: deltaMinutes }));
    setIsResizing(true);
  };

  // Handle resize from bottom handle
  const handleBottomResize = (deltaMinutes: number) => {
    setResizeDelta((prev) => ({ ...prev, bottom: deltaMinutes }));
    setIsResizing(true);
  };

  // Handle resize end
  const handleResizeEnd = () => {
    if (!onResize || (resizeDelta.top === 0 && resizeDelta.bottom === 0)) {
      setIsResizing(false);
      setResizeDelta({ top: 0, bottom: 0 });
      return;
    }

    const startMinutes = timeToMinutes(activity.startTime);
    const endMinutes = timeToMinutes(activity.endTime);

    let newStartMinutes = startMinutes + resizeDelta.top;
    let newEndMinutes = endMinutes + resizeDelta.bottom;

    // Validate: minimum 30 minutes duration
    if (newEndMinutes - newStartMinutes < 30) {
      console.warn('Activity must be at least 30 minutes');
      setIsResizing(false);
      setResizeDelta({ top: 0, bottom: 0 });
      return;
    }

    // Validate: within calendar bounds (3:30 AM to 10:00 PM)
    const minTime = 210; // 3:30 AM
    const maxTime = 1320; // 10:00 PM
    if (newStartMinutes < minTime) newStartMinutes = minTime;
    if (newEndMinutes > maxTime) newEndMinutes = maxTime;

    const newStartTime = minutesToTime(newStartMinutes);
    const newEndTime = minutesToTime(newEndMinutes);

    console.log(`⏱️ Resized ${activity.name}: ${newStartTime} - ${newEndTime}`);
    onResize(activity.id, newStartTime, newEndTime);

    setIsResizing(false);
    setResizeDelta({ top: 0, bottom: 0 });
  };

  // Calculate grid position with resize delta
  const actualGridRowStart = gridRowStart + Math.round(resizeDelta.top / 30);
  const actualGridRowEnd = gridRowEnd + Math.round(resizeDelta.bottom / 30);

  const style = {
    backgroundColor: activity.color || '#f3f4f6',
    gridColumn,
    gridRowStart: isResizing ? actualGridRowStart : gridRowStart,
    gridRowEnd: isResizing ? actualGridRowEnd : gridRowEnd,
    margin: '3px 4px',
    boxShadow: isDragging || isResizing ? '0 20px 40px rgba(0, 0, 0, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
    transition: isDragging || isResizing ? 'none' : 'box-shadow 0.3s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    animationDelay: `${animationDelay}ms`,
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditMode && !isResizing ? 'grab' : 'default',
    zIndex: isDragging || isResizing ? 1000 : 1,
  };

  const handleClick = () => {
    if (isEditMode && !isDragging) {
      onEdit(activity);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isEditMode ? listeners : {})}
      {...(isEditMode ? attributes : {})}
      onClick={handleClick}
      className={`border border-gray-900/10 rounded-lg p-2.5 overflow-hidden group relative animate-block-appear ${
        isEditMode ? 'hover:ring-2 hover:ring-blue-400' : ''
      }`}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(35, 131, 226, 0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
          e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {/* Resize handles - only show in edit mode */}
      {isEditMode && onResize && (
        <>
          <ResizeHandle
            position="top"
            onResize={handleTopResize}
            onResizeEnd={handleResizeEnd}
          />
          <ResizeHandle
            position="bottom"
            onResize={handleBottomResize}
            onResizeEnd={handleResizeEnd}
          />
        </>
      )}

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
}
