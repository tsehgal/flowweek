import Anthropic from '@anthropic-ai/sdk';
import { ScheduleResponse } from '@/types/schedule';

// Soft color palette for dynamic category assignment
const COLOR_PALETTE = [
  '#fef3c7', // soft yellow
  '#dbeafe', // soft blue
  '#fce7f3', // soft pink
  '#d1fae5', // soft green
  '#fed7aa', // soft orange
  '#e0e7ff', // soft indigo
  '#fecaca', // soft red
  '#f3f4f6', // soft gray
  '#fef9c3', // soft lime
  '#d1f4e0', // soft teal
  '#fce4ec', // soft rose
  '#e1f5fe', // soft cyan
  '#f3e5f5', // soft purple
  '#fff9c4', // soft amber
  '#f1f8e9', // soft light green
];

/**
 * Generate a weekly schedule from natural language input using Claude API
 */
export async function generateSchedule(
  userInput: string
): Promise<ScheduleResponse> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildPrompt(userInput);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content from response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude API');
    }

    const responseText = content.text.trim();

    // Parse JSON (handle markdown code blocks if present)
    const jsonText = extractJSON(responseText);
    const parsed = JSON.parse(jsonText);

    // Validate and normalize response
    return validateAndNormalizeResponse(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse JSON response from Claude API');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred while calling Claude API');
  }
}

/**
 * Build the prompt for Claude API
 */
function buildPrompt(userInput: string): string {
  return `You are an AI schedule planner. Parse the user's natural language input and generate an optimized weekly schedule.

User Input:
${userInput}

REQUIREMENTS:
1. Extract all activities with specific times and days
2. Extract weekly goals (total time targets per week)
3. Optimize schedule to avoid conflicts
4. Use 24-hour time format (HH:mm) for all times
5. INTELLIGENTLY identify categories from the user's input - create relevant category names based on the activities mentioned
6. Assign colors from a soft, pastel color palette
7. Return ONLY valid JSON, no markdown, no code blocks, no explanations

CATEGORY CREATION:
- Analyze the user's input and create appropriate category names
- Categories should be short, lowercase, hyphen-separated (e.g., "gym", "work", "side-project", "family-time")
- Group similar activities into the same category
- Common categories: work, gym, learning, family, sleep, meals, hobbies, commute, personal-project
- Be creative - if user mentions specific activities, create relevant categories (e.g., "podcast" for podcast work, "writing" for writing time)

TIME CONSTRAINTS:
- All activities must be scheduled between 03:30 (3:30 AM) and 22:00 (10:00 PM)
- Use 30-minute time slots
- If user specifies vague times (e.g., "morning"), choose reasonable times within constraints

DAY MAPPING:
- Use full day names: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday
- "weekdays" = Monday, Tuesday, Wednesday, Thursday, Friday
- "weekends" = Saturday, Sunday
- "daily" or "every day" = all 7 days
- "4x per week" = distribute across weekdays (e.g., Mon, Tue, Thu, Fri)

COLOR ASSIGNMENT:
- Assign soft, pastel hex colors to each category
- Use colors like: #fef3c7, #dbeafe, #fce7f3, #d1fae5, #fed7aa, #e0e7ff, #fecaca, #f3f4f6, #fef9c3, #d1f4e0
- Ensure each category gets a distinct color

OUTPUT FORMAT (return ONLY this JSON structure, no other text):
{
  "activities": [
    {
      "id": "unique-id-1",
      "name": "Activity Name",
      "category": "category-name",
      "days": ["Monday", "Tuesday"],
      "startTime": "09:00",
      "endTime": "17:00",
      "color": "#hexcode"
    }
  ],
  "weeklyGoals": [
    {
      "name": "Goal Name",
      "targetMinutes": 120,
      "category": "category-name"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no code blocks, no explanations.`;
}

/**
 * Extract JSON from response (handles markdown code blocks)
 */
function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)```/;
  const match = text.match(codeBlockRegex);
  if (match) {
    return match[1].trim();
  }

  // Try to find JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
}

/**
 * Validate and normalize the response from Claude
 */
function validateAndNormalizeResponse(
  parsed: any
): ScheduleResponse {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid response structure from Claude API');
  }

  const activities = Array.isArray(parsed.activities)
    ? parsed.activities.map(validateActivity)
    : [];
  const weeklyGoals = Array.isArray(parsed.weeklyGoals)
    ? parsed.weeklyGoals.map(validateWeeklyGoal)
    : [];

  return {
    activities,
    weeklyGoals,
  };
}

/**
 * Validate and normalize a single activity
 */
function validateActivity(activity: any): any {
  if (!activity || typeof activity !== 'object') {
    throw new Error('Invalid activity structure');
  }

  // Validate required fields
  const name = String(activity.name || 'Unnamed Activity').trim();
  const category = String(activity.category || 'general').toLowerCase().trim();

  // Validate days
  const days = Array.isArray(activity.days)
    ? activity.days
        .map((d: any) => String(d).trim())
        .filter((d: string) =>
          [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday',
          ].includes(d)
        )
    : [];

  if (days.length === 0) {
    throw new Error(`Activity "${name}" has no valid days`);
  }

  // Validate times
  const startTime = validateTime(activity.startTime, name);
  const endTime = validateTime(activity.endTime, name);

  if (!isTimeValid(startTime) || !isTimeValid(endTime)) {
    throw new Error(
      `Activity "${name}" has invalid time range (must be between 03:30 and 22:00)`
    );
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  // Only reject if times are equal (same start and end time is invalid)
  // Midnight-spanning activities (end < start) are allowed
  if (endMinutes === startMinutes) {
    throw new Error(
      `Activity "${name}" has same start and end time (duration must be > 0)`
    );
  }

  // Validate and use color from AI or assign one from palette
  const color = activity.color && typeof activity.color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(activity.color)
    ? activity.color
    : COLOR_PALETTE[0]; // Default to first color if invalid

  // Generate ID if missing
  const id =
    activity.id && typeof activity.id === 'string'
      ? activity.id
      : `${category}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  return {
    id,
    name,
    category,
    days,
    startTime,
    endTime,
    color,
  };
}

/**
 * Validate and normalize a weekly goal
 */
function validateWeeklyGoal(goal: any): any {
  if (!goal || typeof goal !== 'object') {
    throw new Error('Invalid weekly goal structure');
  }

  const name = String(goal.name || 'Unnamed Goal').trim();
  const targetMinutes = Math.max(0, Math.floor(Number(goal.targetMinutes) || 0));
  const category = String(goal.category || 'general').toLowerCase().trim();

  return {
    name,
    targetMinutes,
    category,
  };
}

/**
 * Validate time format (HH:mm)
 */
function validateTime(time: any, activityName: string): string {
  if (!time || typeof time !== 'string') {
    throw new Error(`Activity "${activityName}" has invalid time format`);
  }

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) {
    throw new Error(
      `Activity "${activityName}" has invalid time format (expected HH:mm)`
    );
  }

  return time;
}

/**
 * Check if time is within valid range (03:30 - 22:00)
 */
function isTimeValid(time: string): boolean {
  const minutes = timeToMinutes(time);
  const minMinutes = 210; // 3:30 AM
  const maxMinutes = 1320; // 10:00 PM
  return minutes >= minMinutes && minutes <= maxMinutes;
}

/**
 * Convert time string (HH:mm) to minutes from midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
