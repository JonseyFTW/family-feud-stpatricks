import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

// Helper to parse session data (handles both old format {state only} and new {state, questions})
function parseSessionData(data: unknown): { state: unknown; questions?: unknown } {
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;
  // New format: { state, questions }
  if (parsed && typeof parsed === 'object' && 'state' in (parsed as Record<string, unknown>)) {
    return parsed as { state: unknown; questions?: unknown };
  }
  // Old format: state was stored directly
  return { state: parsed };
}

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const data = await redis.get(`session:${code}`);

    if (!data) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { state, questions } = parseSessionData(data);
    return NextResponse.json({ state, questions });
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json({ error: 'Failed to get session' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    const body = await request.json();
    const { state, questions } = body;

    // Check session exists
    const existing = await redis.get(`session:${code}`);
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Merge: always update state, only update questions if provided
    const existingData = parseSessionData(existing);
    const sessionData = {
      state,
      questions: questions !== undefined ? questions : existingData.questions,
    };

    // Update session, refresh TTL to 4 hours
    await redis.set(`session:${code}`, JSON.stringify(sessionData), { ex: 14400 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    await redis.del(`session:${code}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
