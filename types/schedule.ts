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
