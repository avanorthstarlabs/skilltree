import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { unlinkAuthMethod } from '@/lib/user-store.js';

/**
 * POST /api/v1/profile/unlink — Unlink an auth method from the current user's profile.
 * Body: { provider: "google" | "evm" | "solana" }
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { provider } = body;

    if (!provider || !['google', 'evm', 'solana'].includes(provider)) {
      return NextResponse.json({ error: 'provider must be "google", "evm", or "solana"' }, { status: 400 });
    }

    const user = unlinkAuthMethod(session.user.id, provider);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    if (err.message?.includes('Cannot unlink last')) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('POST /api/v1/profile/unlink failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
