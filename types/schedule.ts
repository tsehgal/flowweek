export interface Activity {
  id: string;
  name: string;
  category: string;
  days: string[];
  startTime: string;
  endTime: string;
  color: string;
}

export interface WeeklyGoal {
  name: string;
  targetMinutes: number;
  category: string;
}

export interface CategoryInfo {
  name: string;
  color: string;
  icon?: string;
}

export interface ScheduleResponse {
  activities: Activity[];
  weeklyGoals: WeeklyGoal[];
}

// Editable activity - one instance per day
export interface EditableActivity extends Omit<Activity, 'days'> {
  id: string;           // Unique per instance: "gym-monday-1"
  originalId: string;   // Links to original: "gym-1"
  day: string;          // Single day: "Monday"
}

// localStorage cache for edited schedules
export interface EditedScheduleCache {
  activities: EditableActivity[];
  lastModified: number;
  originalInputHash: string;
}
