import { NextResponse } from 'next/server';
import { getWorkflowBySlug } from '@/lib/store.js';

export async function GET(request, { params }) {
  try {
    const rawSlug = params?.slug;
    const slug = typeof rawSlug === 'string' ? rawSlug.trim() : null;
    if (!slug) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }
    if (slug.length > 200) {
      return NextResponse.json(
        { error: 'Invalid slug', fields: { slug: 'Must be 200 characters or fewer' } },
        { status: 400 }
      );
    }

    const workflow = getWorkflowBySlug(slug);
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(
      { workflow },
      { status: 200 }
    );
  } catch (err) {
    console.error('GET /api/workflows/[slug] failed', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
