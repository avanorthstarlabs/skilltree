import { NextResponse } from 'next/server';
import { getWorkflowBySlug } from '@/lib/store';

export async function GET(request, { params }) {
  try {
    const slug = params?.slug;
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workflow = getWorkflowBySlug(slug);
    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }
    return NextResponse.json({ workflow });
  } catch (err) {
    console.error('GET /api/workflows/[slug] failed', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
