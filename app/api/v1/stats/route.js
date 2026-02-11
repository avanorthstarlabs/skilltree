import { NextResponse } from 'next/server';
import { getMarketplaceStats } from '@/lib/skill-store.js';

/**
 * GET /api/v1/stats — Public marketplace statistics.
 *
 * Returns aggregate data: total skills, purchases, volume, unique buyers.
 * Useful for agents evaluating the marketplace's health before participating.
 */
export async function GET() {
  try {
    const stats = getMarketplaceStats();

    return NextResponse.json({
      ...stats,
      revenue_split: {
        creator: '80%',
        marketplace: '10%',
        treasury: '10%',
      },
      pricing_model: 'one-time purchase',
      supported_chains: ['base', 'solana'],
    });
  } catch (err) {
    console.error('GET /api/v1/stats failed:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
