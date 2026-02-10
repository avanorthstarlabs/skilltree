import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getWorkflowBySlug, getProposals, createProposal } from '@/lib/store';
import { validateInputs } from '@/lib/validate';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || undefined;
  const proposals = getProposals({ status });
  return NextResponse.json({ proposals });
}

export async function POST(request) {
  const body = await request.json();
  const { workflow_slug, input_payload, created_by } = body;

  if (!workflow_slug || !input_payload) {
    return NextResponse.json(
      { error: 'workflow_slug and input_payload are required' },
      { status: 400 }
    );
  }

  const workflow = getWorkflowBySlug(workflow_slug);
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
  }

  const validation = validateInputs(workflow.inputs_schema, input_payload);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.errors },
      { status: 400 }
    );
  }

  const proposal = {
    id: randomUUID(),
    workflow_id: workflow.id,
    workflow_slug: workflow.slug,
    workflow_name: workflow.name,
    input_payload,
    status: 'pending',
    created_by: created_by || 'operator@local',
    created_at: new Date().toISOString(),
  };

  createProposal(proposal);
  return NextResponse.json({ proposal }, { status: 201 });
}
