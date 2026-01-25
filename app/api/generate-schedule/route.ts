import { NextRequest, NextResponse } from 'next/server';
import { generateSchedule } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userInput } = body;

    // Validate input
    if (!userInput || typeof userInput !== 'string') {
      return NextResponse.json(
        { error: 'Invalid input: userInput is required and must be a string' },
        { status: 400 }
      );
    }

    const trimmedInput = userInput.trim();

    if (trimmedInput.length < 20) {
      return NextResponse.json(
        { error: 'Input must be at least 20 characters long' },
        { status: 400 }
      );
    }

    if (trimmedInput.length > 2000) {
      return NextResponse.json(
        { error: 'Input must be at most 2000 characters long' },
        { status: 400 }
      );
    }

    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        {
          error:
            'Server configuration error: Claude API key is not configured',
        },
        { status: 500 }
      );
    }

    // Generate schedule using Claude API
    const scheduleData = await generateSchedule(trimmedInput);

    return NextResponse.json(scheduleData, { status: 200 });
  } catch (error) {
    console.error('Error generating schedule:', error);

    // Handle specific error types
    if (error instanceof Error) {
      // API key missing
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        return NextResponse.json(
          {
            error:
              'Server configuration error: Claude API key is not configured',
          },
          { status: 500 }
        );
      }

      // JSON parsing errors
      if (error.message.includes('parse JSON') || error instanceof SyntaxError) {
        return NextResponse.json(
          {
            error:
              'Failed to parse schedule response. Please try rephrasing your input.',
          },
          { status: 500 }
        );
      }

      // Validation errors
      if (error.message.includes('Invalid') || error.message.includes('Activity')) {
        return NextResponse.json(
          {
            error: `Schedule validation error: ${error.message}`,
          },
          { status: 500 }
        );
      }

      // Claude API errors (rate limits, etc.)
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          {
            error:
              'Service temporarily unavailable. Please try again in a moment.',
          },
          { status: 503 }
        );
      }

      // Generic API errors
      if (error.message.includes('API') || error.message.includes('Claude')) {
        return NextResponse.json(
          {
            error:
              'Failed to generate schedule. Please check your input and try again.',
          },
          { status: 500 }
        );
      }
    }

    // Generic error fallback
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    );
  }
}
