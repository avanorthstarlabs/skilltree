import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { findUserByWalletAddress, linkAuthMethod } from '@/lib/user-store.js';
import { verifyWalletSignature } from '@/lib/wallet-verify.js';
import { validateNonce } from '@/lib/nonce-store.js';

/**
 * POST /api/v1/profile/link — Link a wallet to the current user's profile.
 * Body: { address, signature, message, nonce, chain }
 */
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { address, signature, message, nonce, chain } = body;

    if (!address || !signature || !message || !nonce || !chain) {
      return NextResponse.json({ error: 'Missing required fields: address, signature, message, nonce, chain' }, { status: 400 });
    }

    // Validate nonce
    if (!validateNonce(nonce)) {
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 400 });
    }

    // Verify signature
    const valid = await verifyWalletSignature({ address, signature, message, chain });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid wallet signature' }, { status: 400 });
    }

    const providerKey = chain === 'solana' ? 'solana' : 'evm';

    // Check if wallet is already linked to another user
    const existingUser = findUserByWalletAddress(address, providerKey);
    if (existingUser && existingUser.id !== session.user.id) {
      return NextResponse.json({ error: 'This wallet is already linked to another account' }, { status: 409 });
    }

    const user = linkAuthMethod(session.user.id, providerKey, {
      address,
      chain: chain === 'solana' ? 'solana' : 'base',
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    console.error('POST /api/v1/profile/link failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
