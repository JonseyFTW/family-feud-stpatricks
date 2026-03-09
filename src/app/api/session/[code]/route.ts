import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

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

    // data may already be parsed by @upstash/redis
    const state = typeof data === 'string' ? JSON.parse(data) : data;
    return NextResponse.json({ state });
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
    const { state } = body;

    // Check session exists
    const existing = await redis.get(`session:${code}`);
    if (!existing) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update state, refresh TTL to 4 hours
    await redis.set(`session:${code}`, JSON.stringify(state), { ex: 14400 });

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
