import { NextResponse } from 'next/server';
import { generateNonce } from '@/lib/nonce-store.js';

export async function GET() {
  const nonce = generateNonce();
  return NextResponse.json({ nonce });
}
