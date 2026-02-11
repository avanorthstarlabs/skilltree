import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import {
  getProposalById,
  getApprovalByProposalId,
  getWorkflowBySlug,
  createApproval,
  createReceipt,
  updateProposal,
} from '@/lib/store';
import { simulateExecution, createSignedIntent } from '@/lib/simulator';

export async function POST(request) {
  const body = await request.json();
  const { proposal_id, decision, approved_by, rationale } = body;

  if (!proposal_id || !decision || !rationale) {
    return NextResponse.json(
      { error: 'proposal_id, decision, and rationale are required' },
      { status: 400 }
    );
  }

  if (!['approved', 'rejected'].includes(decision)) {
    return NextResponse.json(
      { error: 'decision must be "approved" or "rejected"' },
      { status: 400 }
    );
  }

  if (rationale.length < 10) {
    return NextResponse.json(
      { error: 'Rationale must be at least 10 characters' },
      { status: 400 }
    );
  }

  const proposal = getProposalById(proposal_id);
  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  if (proposal.status !== 'pending') {
    return NextResponse.json(
      { error: 'Proposal has already been decided' },
      { status: 409 }
    );
  }

  const existingApproval = getApprovalByProposalId(proposal_id);
  if (existingApproval) {
    return NextResponse.json(
      { error: 'Proposal already has an approval record' },
      { status: 409 }
    );
  }

  const approval = {
    id: randomUUID(),
    proposal_id,
    decision,
    approved_by: approved_by || 'operator@local',
    rationale,
    created_at: new Date().toISOString(),
  };

  createApproval(approval);
  updateProposal(proposal_id, { status: decision });

  let receipt = null;

  if (decision === 'approved') {
    const workflow = getWorkflowBySlug(proposal.workflow_slug);
    const { run_status, output_payload } = simulateExecution(workflow, proposal);
    const { canonical, signature } = createSignedIntent(proposal, approval);

    receipt = {
      id: randomUUID(),
      proposal_id,
      workflow_name: proposal.workflow_name,
      output_payload,
      run_status,
      signed_intent: { canonical, signature },
      created_at: new Date().toISOString(),
    };

    createReceipt(receipt);
    updateProposal(proposal_id, { status: 'executed' });
  }

  const updatedProposal = getProposalById(proposal_id);
  return NextResponse.json({ proposal: updatedProposal, approval, receipt });
}
