import { NextResponse } from 'next/server';
import { getReceipts } from '@/lib/store';

export async function GET() {
  const receipts = getReceipts();
  return NextResponse.json({ receipts });
}
