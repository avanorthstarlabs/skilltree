import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserById, updateUser } from '@/lib/user-store.js';

/**
 * GET /api/v1/profile — Get the current user's profile.
 * PATCH /api/v1/profile — Update display_name.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const user = getUserById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error('GET /api/v1/profile failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const allowedFields = {};

    if (body.display_name && typeof body.display_name === 'string') {
      const trimmed = body.display_name.trim();
      if (trimmed.length > 0 && trimmed.length <= 50) {
        allowedFields.display_name = trimmed;
      }
    }

    if (Object.keys(allowedFields).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = updateUser(session.user.id, allowedFields);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    console.error('PATCH /api/v1/profile failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
