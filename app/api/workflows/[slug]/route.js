import { NextResponse } from 'next/server';
import { getWorkflowBySlug } from '@/lib/store';

export async function GET(request, { params }) {
  const workflow = getWorkflowBySlug(params.slug);
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }
  return NextResponse.json({ workflow });
}
