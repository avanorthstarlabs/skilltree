import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getSkillBySlug, hasPurchased, createPurchase } from '@/lib/skill-store.js';
import { extractPreview } from '@/lib/skill-parser.js';
import { verifyPayment } from '@/lib/chain-verify.js';
import { getAllAddressesForUser } from '@/lib/user-store.js';

/**
 * POST /api/v1/skills/:slug/purchase — Purchase a paid skill.
 *
 * Body: {
 *   buyer_address: "0x...",  — wallet address of the buyer (optional if session-based)
 *   tx_hash: "0x...",        — on-chain transaction hash proving payment
 *   chain: "base"|"solana"   — which chain the payment was made on
 * }
 *
 * Session-based: If authenticated and buyer_address is omitted, uses the user's
 * linked wallet for the specified chain. Also checks all linked wallets for existing purchases.
 */
export async function POST(request, { params }) {
  try {
    const { slug } = await params;
    const skill = getSkillBySlug(slug);

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const preview = extractPreview(skill);

    // Free skills don't need purchase
    if (preview.isFree) {
      return NextResponse.json({
        success: true,
        message: 'This skill is free — no purchase needed.',
        download_url: `/api/v1/skills/${slug}/download`,
      });
    }

    const body = await request.json();

    // Resolve buyer_address: from body or from session
    let buyerAddress = body.buyer_address;
    const session = await auth();

    if (!buyerAddress && session?.user?.id) {
      // Use linked wallet for the specified chain
      const addresses = getAllAddressesForUser(session.user.id);
      if (addresses.length > 0) {
        buyerAddress = addresses[0]; // Default to first linked wallet
      }
    }

    if (!buyerAddress) {
      return NextResponse.json(
        { success: false, errors: ['buyer_address is required'] },
        { status: 400 }
      );
    }

    if (!body.tx_hash) {
      return NextResponse.json(
        { success: false, errors: ['tx_hash is required — submit the on-chain payment transaction hash'] },
        { status: 400 }
      );
    }

    if (!body.chain || !['base', 'solana'].includes(body.chain)) {
      return NextResponse.json(
        { success: false, errors: ['chain must be "base" or "solana"'] },
        { status: 400 }
      );
    }

    // Check for existing purchase — check all linked wallets if session-based
    if (hasPurchased(buyerAddress, slug)) {
      return NextResponse.json({
        success: true,
        message: 'Already purchased.',
        download_url: `/api/v1/skills/${slug}/download`,
      });
    }

    if (session?.user?.id) {
      const allAddresses = getAllAddressesForUser(session.user.id);
      for (const addr of allAddresses) {
        if (hasPurchased(addr, slug)) {
          return NextResponse.json({
            success: true,
            message: 'Already purchased.',
            download_url: `/api/v1/skills/${slug}/download`,
          });
        }
      }
    }

    // Verify payment on-chain
    const verification = await verifyPayment(body.tx_hash, body.chain, preview.price.amount);

    let verificationStatus = 'verified';

    if (!verification.verified) {
      if (verification.fallback) {
        verificationStatus = 'unverified';
      } else {
        return NextResponse.json({
          success: false,
          errors: [`Payment verification failed: ${verification.reason}`],
        }, { status: 402 });
      }
    }

    const purchase = createPurchase({
      buyerAddress,
      skillSlug: slug,
      txHash: body.tx_hash,
      chain: body.chain,
      amount: preview.price.amount,
      currency: preview.price.currency,
      verificationStatus,
      verificationDetails: verification.details || null,
    });

    return NextResponse.json({
      success: true,
      purchase,
      verification_status: verificationStatus,
      download_url: `/api/v1/skills/${slug}/download`,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    if (err.message?.includes('already been used')) {
      return NextResponse.json({ success: false, errors: [err.message] }, { status: 409 });
    }
    console.error(`POST /api/v1/skills/${params?.slug}/purchase failed:`, err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
