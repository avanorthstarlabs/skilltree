'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function ProposalDetailPage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function fetchProposal() {
    setLoading(true);
    setError(null);
    fetch(`/api/proposals/${params.id}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load proposal (${r.status})`);
        return r.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load proposal');
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchProposal();
  }, [params.id]);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
        <div className="detail-grid">
          <div className="card">
            <div className="skeleton skeleton-text-sm" />
            <div className="skeleton-stack">
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </div>
          </div>
          <div className="card">
            <div className="skeleton skeleton-text-sm" />
            <div className="skeleton skeleton-block" />
          </div>
          <div className="card">
            <div className="skeleton skeleton-text-sm" />
            <div className="skeleton-stack">
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
              <div className="skeleton skeleton-line" />
            </div>
          </div>
          <div className="card">
            <div className="skeleton skeleton-text-sm" />
            <div className="skeleton skeleton-block" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Proposal Detail</h1>
          <p>View proposal information and audit trail</p>
        </div>
        <div className="error-state">
          <div className="error-state-icon">⚠️</div>
          <h3>Failed to Load Proposal</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchProposal}>
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!data?.proposal) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Proposal Detail</h1>
          <p>View proposal information and audit trail</p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>Proposal Not Found</h3>
          <p>The proposal you&apos;re looking for doesn&apos;t exist or may have been removed.</p>
          <a href="/approvals" className="btn btn-primary mt-16">Browse Approvals</a>
        </div>
      </div>
    );
  }

  const { proposal, approval, receipt } = data;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Proposal Detail</h1>
        <p>{proposal.workflow_name || proposal.workflow_slug}</p>
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 className="section-title">Proposal Info</h3>
          <div className="detail-fields">
            <div><strong>ID:</strong> {proposal.id}</div>
            <div><strong>Workflow:</strong> {proposal.workflow_name}</div>
            <div><strong>Status:</strong> <span className={`badge badge-${proposal.status}`}>{proposal.status}</span></div>
            <div><strong>Created by:</strong> {proposal.created_by}</div>
            <div><strong>Created:</strong> {new Date(proposal.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div className="card">
          <h3 className="section-title">Input Payload</h3>
          {proposal.input_payload && Object.keys(proposal.input_payload).length > 0 ? (
            <div className="json-viewer">
              <pre>{JSON.stringify(proposal.input_payload, null, 2)}</pre>
            </div>
          ) : (
            <div className="empty-state-inline">
              <span className="empty-state-inline-icon">📋</span>
              <p>No input payload provided</p>
            </div>
          )}
        </div>

        {approval && (
          <div className="card">
            <h3 className="section-title">Approval Decision</h3>
            <div className="detail-fields">
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

        {!approval && proposal.status === 'pending' && (
          <div className="card">
            <h3 className="section-title">Approval Decision</h3>
            <div className="empty-state-inline">
              <span className="empty-state-inline-icon">⏳</span>
              <p>Awaiting approval decision</p>
            </div>
          </div>
        )}

        {receipt && (
          <div className="card">
            <h3 className="section-title">Execution Receipt</h3>
            <div className="detail-fields mb-16">
              <div><strong>Status:</strong> <span className={`badge badge-${receipt.run_status === 'success' ? 'executed' : 'rejected'}`}>{receipt.run_status}</span></div>
              <div><strong>Receipt ID:</strong> {receipt.id}</div>
            </div>
            {receipt.output_payload && Object.keys(receipt.output_payload).length > 0 ? (
              <div className="json-viewer">
                <pre>{JSON.stringify(receipt.output_payload, null, 2)}</pre>
              </div>
            ) : (
              <div className="empty-state-inline">
                <span className="empty-state-inline-icon">📦</span>
                <p>No output payload available</p>
              </div>
            )}
          </div>
        )}

        {!receipt && proposal.status !== 'pending' && proposal.status !== 'rejected' && (
          <div className="card">
            <h3 className="section-title">Execution Receipt</h3>
            <div className="empty-state-inline">
              <span className="empty-state-inline-icon">📦</span>
              <p>No execution receipt yet</p>
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
