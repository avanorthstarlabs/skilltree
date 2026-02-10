import { NextResponse } from 'next/server';
import { getWorkflows } from '@/lib/store';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const category = searchParams.get('category') || undefined;
  const tag = searchParams.get('tag') || undefined;

  const workflows = getWorkflows({ search, category, tag });
  return NextResponse.json({ workflows });
}
