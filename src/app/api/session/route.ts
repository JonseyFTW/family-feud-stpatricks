import { redis } from '@/lib/redis';
import { NextResponse } from 'next/server';

function generateCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { state } = body;

    // Generate a unique 4-digit code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await redis.get(`session:${code}`);
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    if (attempts >= 10) {
      return NextResponse.json({ error: 'Could not generate unique code' }, { status: 500 });
    }

    // Store state with 4-hour TTL (14400 seconds)
    await redis.set(`session:${code}`, JSON.stringify(state), { ex: 14400 });

    return NextResponse.json({ code });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}
