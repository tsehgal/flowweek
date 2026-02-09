/**
 * Convert time string (HH:mm) to minutes from midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to grid row index
 * Start time is 3:30 AM (210 minutes), each slot is 30 minutes
 */
export function minutesToGridRow(minutes: number): number {
  return Math.floor((minutes - 210) / 30);
}

/**
 * Format time string for display (e.g., "14:30" -> "2:30 PM")
 */
export function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get current day name (e.g., "Monday")
 */
export function getCurrentDay(): string {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[new Date().getDay()];
}

/**
 * Generate time slots from 3:30 AM to 10:00 PM in 30-minute intervals
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const startMinutes = 210; // 3:30 AM
  const endMinutes = 1320; // 10:00 PM

  for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}`;
    slots.push(timeString);
  }

  return slots;
}

/**
 * Normalize activities: Split multi-day activities into single-day instances
 */
export function normalizeActivities(activities: any[]): any[] {
  return activities.flatMap((activity, activityIndex) =>
    activity.days.map((day: string, dayIndex: number) => ({
      ...activity,
      id: `${activity.id || `activity-${activityIndex}`}-${day.toLowerCase()}-${dayIndex}`,
      originalId: activity.id || `activity-${activityIndex}`,
      day,
    }))
  );
}

/**
 * Denormalize activities: Merge single-day instances back into multi-day activities
 */
export function denormalizeActivities(editables: any[]): any[] {
  const grouped = new Map<string, any>();

  editables.forEach((editable) => {
    const key = `${editable.originalId}-${editable.startTime}-${editable.endTime}-${editable.name}`;

    if (grouped.has(key)) {
      const existing = grouped.get(key);
      existing.days.push(editable.day);
    } else {
      grouped.set(key, {
        id: editable.originalId,
        name: editable.name,
        category: editable.category,
        days: [editable.day],
        startTime: editable.startTime,
        endTime: editable.endTime,
        color: editable.color,
      });
    }
  });

  return Array.from(grouped.values());
}
