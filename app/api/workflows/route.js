import { NextResponse } from 'next/server';
import { getWorkflows } from '@/lib/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const tag = searchParams.get('tag') || undefined;

    const workflows = getWorkflows({
      search: typeof search === 'string' && search.trim() ? search.trim() : undefined,
      category: typeof category === 'string' && category.trim() ? category.trim() : undefined,
      tag: typeof tag === 'string' && tag.trim() ? tag.trim() : undefined
    });

    return NextResponse.json({
      workflows,
      filters: {
        search: search || null,
        category: category || null,
        tag: tag || null
      }
    });
  } catch (err) {
    console.error('GET /api/workflows failed', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
