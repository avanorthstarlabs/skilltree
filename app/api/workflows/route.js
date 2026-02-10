import { NextResponse } from 'next/server';
import { getWorkflows } from '@/lib/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');

    const normalizedSearch = typeof search === 'string' && search.trim() ? search.trim() : undefined;
    const normalizedCategory = typeof category === 'string' && category.trim() ? category.trim() : undefined;
    const normalizedTag = typeof tag === 'string' && tag.trim() ? tag.trim() : undefined;

    const workflows = getWorkflows({
      search: normalizedSearch,
      category: normalizedCategory,
      tag: normalizedTag
    });

    return NextResponse.json({
      workflows,
      filters: {
        search: normalizedSearch || null,
        category: normalizedCategory || null,
        tag: normalizedTag || null
      }
    });
  } catch (err) {
    console.error('GET /api/workflows failed', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
