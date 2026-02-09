'use client';

import { useDroppable } from '@dnd-kit/core';

interface DroppableCellProps {
  id: string;
  day: string;
  time: string;
  isToday: boolean;
  rowNumber: number;
  columnNumber: number;
}

export default function DroppableCell({
  id,
  day,
  time,
  isToday,
  rowNumber,
  columnNumber,
}: DroppableCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      day,
      time,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-l border-[#e9e9e7]/50 relative ${
        isToday ? 'bg-[#2383e2]/5' : ''
      } ${isOver ? 'bg-blue-100' : ''}`}
      style={{ gridRow: rowNumber, gridColumn: columnNumber }}
    />
  );
}
