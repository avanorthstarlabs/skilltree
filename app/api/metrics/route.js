import { NextResponse } from 'next/server';
import { getProposals, getReceipts } from '@/lib/store';

export async function GET() {
  const allProposals = getProposals();
  const allReceipts = getReceipts();

  const total = allProposals.length;
  const pending = allProposals.filter(p => p.status === 'pending').length;
  const approved = allProposals.filter(p => p.status === 'approved').length;
  const rejected = allProposals.filter(p => p.status === 'rejected').length;
  const executed = allProposals.filter(p => p.status === 'executed').length;

  const decided = approved + rejected + executed;
  const approvalRate = decided > 0
    ? Math.round(((approved + executed) / decided) * 100)
    : 0;

  const successfulReceipts = allReceipts.filter(r => r.run_status === 'success').length;
  const failedReceipts = allReceipts.filter(r => r.run_status === 'failed').length;

  // Breakdown by workflow
  const byWorkflow = {};
  for (const p of allProposals) {
    const name = p.workflow_name || p.workflow_slug || 'Unknown';
    if (!byWorkflow[name]) byWorkflow[name] = { total: 0, executed: 0 };
    byWorkflow[name].total++;
    if (p.status === 'executed') byWorkflow[name].executed++;
  }

  return NextResponse.json({
    metrics: {
      total_proposals: total,
      pending,
      approved,
      rejected,
      executed,
      approval_rate: approvalRate,
      total_receipts: allReceipts.length,
      successful_executions: successfulReceipts,
      failed_executions: failedReceipts,
      by_workflow: byWorkflow,
    },
  });
}
