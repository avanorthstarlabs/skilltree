'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ProposalDetailPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/proposals/${params.id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="empty-state"><p>Loading...</p></div>;
  if (!data?.proposal) return <div className="empty-state"><h3>Proposal not found</h3></div>;

  const { proposal, approval, receipt } = data;

  return (
    <div>
      <div className="page-header">
        <h1>Proposal Detail</h1>
        <p>{proposal.workflow_name || proposal.workflow_slug}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Proposal Info</h3>
          <div className="text-sm" style={{ display: 'grid', gap: 8 }}>
            <div><strong>ID:</strong> {proposal.id}</div>
            <div><strong>Workflow:</strong> {proposal.workflow_name}</div>
            <div><strong>Status:</strong> <span className={`badge badge-${proposal.status}`}>{proposal.status}</span></div>
            <div><strong>Created by:</strong> {proposal.created_by}</div>
            <div><strong>Created:</strong> {new Date(proposal.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Input Payload</h3>
          <div className="json-viewer">
            <pre>{JSON.stringify(proposal.input_payload, null, 2)}</pre>
          </div>
        </div>

        {approval && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Approval Decision</h3>
            <div className="text-sm" style={{ display: 'grid', gap: 8 }}>
              <div>
                <strong>Decision:</strong>{' '}
                <span className={`badge badge-${approval.decision}`}>{approval.decision}</span>
              </div>
              <div><strong>By:</strong> {approval.approved_by}</div>
              <div><strong>Rationale:</strong> {approval.rationale}</div>
              <div><strong>At:</strong> {new Date(approval.created_at).toLocaleString()}</div>
            </div>
          </div>
        )}

        {receipt && (
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>Execution Receipt</h3>
            <div className="text-sm mb-16">
              <div><strong>Status:</strong> <span className={`badge badge-${receipt.run_status === 'success' ? 'approved' : 'rejected'}`}>{receipt.run_status}</span></div>
              <div><strong>Receipt ID:</strong> {receipt.id}</div>
            </div>
            <div className="json-viewer">
              <pre>{JSON.stringify(receipt.output_payload, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      <div className="mt-24">
        <a href="/approvals" className="btn btn-outline">← Back to Approvals</a>
      </div>
    </div>
  );
}
