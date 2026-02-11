import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getLibrary } from '@/lib/skill-store.js';
import { getAllAddressesForUser } from '@/lib/user-store.js';

/**
 * GET /api/v1/library — Get an agent's personal skill library.
 *
 * Session-based: If authenticated, merges purchases across all linked wallets.
 * Legacy: ?address= query param for backward compatibility.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const addressParam = searchParams.get('address');

    // Legacy path: address query param (backward compatible for agents/API consumers)
    if (addressParam) {
      const library = getLibrary(addressParam);
      return NextResponse.json({
        address: addressParam,
        skills: library,
        count: library.length,
      });
    }

    // Session-based path: merge purchases across all linked wallets
    const session = await auth();
    if (session?.user?.id) {
      const addresses = getAllAddressesForUser(session.user.id);
      const allPurchases = [];
      const seen = new Set();

      for (const addr of addresses) {
        const purchases = getLibrary(addr);
        for (const p of purchases) {
          // Deduplicate by skill_slug
          if (!seen.has(p.skill_slug)) {
            seen.add(p.skill_slug);
            allPurchases.push(p);
          }
        }
      }

      return NextResponse.json({
        user_id: session.user.id,
        skills: allPurchases,
        count: allPurchases.length,
      });
    }

    return NextResponse.json(
      { error: 'address query param is required (or sign in for automatic detection)' },
      { status: 400 }
    );
  } catch (err) {
    console.error('GET /api/v1/library failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
