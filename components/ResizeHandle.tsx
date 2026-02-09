'use client';

import { useState, useRef, useEffect } from 'react';

interface ResizeHandleProps {
  position: 'top' | 'bottom';
  onResize: (deltaMinutes: number) => void;
  onResizeEnd: () => void;
}

export default function ResizeHandle({ position, onResize, onResizeEnd }: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const totalDeltaRef = useRef<number>(0);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const deltaY = e.clientY - startYRef.current;

      // Each 32px grid row = 30 minutes
      // So deltaMinutes = (deltaY / 32) * 30
      const deltaMinutes = Math.round((deltaY / 32) * 30);

      // Snap to 30-minute increments
      const snappedDelta = Math.round(deltaMinutes / 30) * 30;

      if (snappedDelta !== totalDeltaRef.current) {
        totalDeltaRef.current = snappedDelta;
        // For top handle, moving down increases start time (positive delta)
        // For bottom handle, moving down increases end time (positive delta)
        onResize(position === 'top' ? snappedDelta : snappedDelta);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      totalDeltaRef.current = 0;
      onResizeEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position, onResize, onResizeEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startYRef.current = e.clientY;
    totalDeltaRef.current = 0;
  };

  return (
    <div
      className={`absolute left-0 right-0 h-2 cursor-ns-resize z-20 group/handle ${
        position === 'top' ? 'top-0 -mt-1' : 'bottom-0 -mb-1'
      }`}
      onMouseDown={handleMouseDown}
    >
      {/* Visual indicator on hover */}
      <div
        className={`absolute left-0 right-0 h-1 bg-blue-500 opacity-0 group-hover/handle:opacity-100 transition-opacity ${
          isDragging ? 'opacity-100' : ''
        } ${position === 'top' ? 'top-0' : 'bottom-0'}`}
      />
    </div>
  );
}
