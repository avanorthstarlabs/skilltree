import { NextResponse } from 'next/server';
import { getProposalById, getApprovalByProposalId, getReceiptByProposalId } from '@/lib/store';

export async function GET(request, { params }) {
  const proposal = getProposalById(params.id);
  if (!proposal) {
    return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
  }

  const approval = getApprovalByProposalId(proposal.id);
  const receipt = getReceiptByProposalId(proposal.id);

  return NextResponse.json({ proposal, approval, receipt });
}
