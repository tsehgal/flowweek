'use client';

import { useState, useRef } from 'react';
import { ScheduleResponse } from '@/types/schedule';
import { jsPDF } from 'jspdf';
import ical, { ICalCalendar, ICalAlarmType } from 'ical-generator';
import { format, addDays, startOfWeek } from 'date-fns';
import { mockData } from '@/lib/mockData';

interface ExportDropdownProps {
  scheduleData: ScheduleResponse | null;
  calendarRef: React.RefObject<HTMLDivElement | null>;
}

// Emoji mapping for categories (used in Google Calendar export)
const categoryEmojis: Record<string, string> = {
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

export default function ExportDropdown({
  scheduleData,
  calendarRef,
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Helper: Convert time string (HH:MM) to Date object for a specific day
  const timeToDate = (dayIndex: number, timeString: string): Date => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const targetDay = addDays(monday, dayIndex);
    targetDay.setHours(hours, minutes, 0, 0);
    return targetDay;
  };

  // Export to PDF
  const handlePDFExport = async () => {
    if (!calendarRef.current) {
      alert('Calendar not found. Please try again.');
      return;
    }

    setIsExporting(true);
    try {
      const element = calendarRef.current;

      // Find the inner overflow container (the one with the actual calendar grid)
      const innerContainer = element.querySelector('.flex-1.overflow-auto') as HTMLElement;

      // Store original styles
      const originalStyles = {
        elementHeight: element.style.height,
        elementMaxHeight: element.style.maxHeight,
        innerOverflow: innerContainer?.style.overflow,
        innerHeight: innerContainer?.style.height,
        innerMaxHeight: innerContainer?.style.maxHeight,
      };

      // Temporarily make everything visible and auto-sized
      element.style.height = 'auto';
      element.style.maxHeight = 'none';
      if (innerContainer) {
        innerContainer.style.overflow = 'visible';
        innerContainer.style.height = 'auto';
        innerContainer.style.maxHeight = 'none';
      }

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Dynamically import modern-screenshot (client-side only, handles modern CSS + emojis)
      const { domToPng } = await import('modern-screenshot');

      // Capture as PNG with high quality
      const dataUrl = await domToPng(element, {
        scale: 1.5,
        backgroundColor: '#ffffff',
      });

      // Restore original styles
      element.style.height = originalStyles.elementHeight;
      element.style.maxHeight = originalStyles.elementMaxHeight;
      if (innerContainer) {
        innerContainer.style.overflow = originalStyles.innerOverflow || '';
        innerContainer.style.height = originalStyles.innerHeight;
        innerContainer.style.maxHeight = originalStyles.innerMaxHeight;
      }

      // Create image to get dimensions
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = img.width;
      const imgHeight = img.height;

      // Create PDF with proper sizing
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate scaling to fit content on page
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;

      // Center the image on the page
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(dataUrl, 'PNG', x, y, scaledWidth, scaledHeight);
      pdf.save(`FlowWeek-Schedule-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  // Export to Google Calendar (.ics)
  const handleICSExport = () => {
    const data = scheduleData || mockData;

    try {
      const calendar: ICalCalendar = ical({
        name: 'FlowWeek Schedule',
        prodId: '//FlowWeek//Schedule//EN',
      });

      data.activities.forEach((activity) => {
        activity.days.forEach((day) => {
          const dayIndex = DAYS.indexOf(day);
          if (dayIndex === -1) return;

          const startDate = timeToDate(dayIndex, activity.startTime);
          const endDate = timeToDate(dayIndex, activity.endTime);

          // Get emoji for category (if available)
          const emoji = categoryEmojis[activity.category] || '';
          const eventTitle = emoji ? `${emoji} ${activity.name}` : activity.name;

          const event = calendar.createEvent({
            start: startDate,
            end: endDate,
            summary: eventTitle,
            description: `Category: ${activity.category}`,
            location: '',
          });

          // Add reminder 15 minutes before
          event.createAlarm({
            type: ICalAlarmType.display,
            trigger: 900, // 15 minutes in seconds
          });
        });
      });

      // Download .ics file
      const icsContent = calendar.toString();
      const blob = new Blob([icsContent], { type: 'text/calendar' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FlowWeek-Schedule-${format(new Date(), 'yyyy-MM-dd')}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('ICS export failed:', error);
      alert('Failed to export calendar. Please try again.');
    } finally {
      setIsOpen(false);
    }
  };

  // Export to CSV (Notion-friendly)
  const handleCSVExport = () => {
    const data = scheduleData || mockData;

    try {
      // CSV Header
      const headers = ['Day', 'Time', 'Activity', 'Category', 'Duration'];
      const rows: string[][] = [headers];

      // Helper to calculate duration
      const calculateDuration = (startTime: string, endTime: string): string => {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;
        const duration = endMinutes - startMinutes;
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
      };

      // Add each activity
      data.activities.forEach((activity) => {
        activity.days.forEach((day) => {
          const duration = calculateDuration(activity.startTime, activity.endTime);
          rows.push([
            day,
            `${activity.startTime} - ${activity.endTime}`,
            activity.name,
            activity.category,
            duration,
          ]);
        });
      });

      // Convert to CSV string
      const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `FlowWeek-Schedule-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export failed:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-[#2383e2] text-white text-sm font-semibold rounded-lg hover:bg-[#1a6dc4] transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {isExporting ? 'Exporting...' : 'Export'}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-[#e9e9e7] overflow-hidden z-20">
            <button
              onClick={handlePDFExport}
              className="w-full px-4 py-3 text-left text-sm text-[#272626] hover:bg-[#f4f5f7] transition-colors duration-150 flex items-center gap-3"
            >
              <svg
                className="w-5 h-5 text-[#787774]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              <span className="font-medium">Download as PDF</span>
            </button>

            <button
              onClick={handleICSExport}
              className="w-full px-4 py-3 text-left text-sm text-[#272626] hover:bg-[#f4f5f7] transition-colors duration-150 flex items-center gap-3 border-t border-[#e9e9e7]"
            >
              <svg
                className="w-5 h-5 text-[#787774]"
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
              <span className="font-medium">Export to Google Calendar</span>
            </button>

            <button
              onClick={handleCSVExport}
              className="w-full px-4 py-3 text-left text-sm text-[#272626] hover:bg-[#f4f5f7] transition-colors duration-150 flex items-center gap-3 border-t border-[#e9e9e7]"
            >
              <svg
                className="w-5 h-5 text-[#787774]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="font-medium">Export to Notion (CSV)</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
