'use client';

import { useState, useEffect, useCallback } from 'react';

export default function ApprovalsPage() {
  const [proposals, setProposals] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [rationale, setRationale] = useState('');
  const [acting, setActing] = useState(false);

  const fetchProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter ? `?status=${filter}` : '';
      const res = await fetch(`/api/proposals${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch proposals (${res.status})`);
      }
      const data = await res.json();
      setProposals(data.proposals || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchProposals();
  }, [fetchProposals]);

  // Close modal on Escape key
  useEffect(() => {
    if (!actionModal) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setActionModal(null);
        setRationale('');
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [actionModal]);

  async function handleDecision(proposalId, decision) {
    if (rationale.length < 10) return;
    setActing(true);
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: proposalId,
          decision,
          approved_by: 'operator@local',
          rationale,
        }),
      });
      if (!res.ok) {
        throw new Error(`Failed to submit decision (${res.status})`);
      }
    } catch (e) {
      setError(e.message);
    }
    setActionModal(null);
    setRationale('');
    setActing(false);
    fetchProposals();
  }

  const statusFilters = ['pending', 'approved', 'rejected', 'executed', ''];

  const skeletonRows = Array.from({ length: 5 }, (_, i) => (
    <tr key={`skeleton-${i}`}>
      <td>
        <div className="skeleton skeleton-text mb-16" />
        <div className="skeleton skeleton-text-short" />
      </td>
      <td><div className="skeleton skeleton-text-short" /></td>
      <td><div className="skeleton skeleton-badge" /></td>
      <td><div className="skeleton skeleton-text-short" /></td>
      <td><div className="skeleton skeleton-button" /></td>
    </tr>
  ));

  return (
    <div>
      <div className="page-header">
        <h1>Approval Queue</h1>
        <p>Review and approve or reject pending workflow run proposals.</p>
      </div>

      <div className="chip-group mb-24">
        {statusFilters.map(s => (
          <button
            key={s || 'all'}
            className={`chip${filter === s ? ' active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="error-banner mb-24">
          <div className="error-banner-icon">&#9888;</div>
          <div className="error-banner-content">
            <div className="error-banner-heading">Error</div>
            <div className="error-banner-message">{error}</div>
          </div>
          <button className="btn btn-outline" onClick={() => { setError(null); fetchProposals(); }}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {skeletonRows}
              </tbody>
            </table>
          </div>
        </div>
      ) : proposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">&#128203;</div>
          <h3>No proposals found</h3>
          <p>{filter === 'pending' ? 'No pending proposals to review. All clear!' : 'Try changing the filter.'}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-semibold">{p.workflow_name || p.workflow_slug}</div>
                      <div className="text-xs text-muted">{p.id.slice(0, 8)}...</div>
                    </td>
                    <td className="text-sm">{p.created_by}</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                    <td className="text-sm text-muted">{new Date(p.created_at).toLocaleString()}</td>
                    <td>
                      {p.status === 'pending' ? (
                        <div className="flex gap-8">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => setActionModal({ id: p.id, decision: 'approved' })}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setActionModal({ id: p.id, decision: 'rejected' })}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <a
                          href={`/approvals/${p.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {actionModal && (
        <div
          className="modal-backdrop"
          onClick={() => { setActionModal(null); setRationale(''); }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-16">
              {actionModal.decision === 'approved' ? 'Approve' : 'Reject'} Proposal
            </h3>
            <div className="form-group">
              <label className="form-label" htmlFor="rationale-textarea">
                Rationale (min 10 characters)
              </label>
              <textarea
                id="rationale-textarea"
                className="form-textarea"
                placeholder="Explain your decision..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
              />
              {rationale.length > 0 && rationale.length < 10 && (
                <div className="form-error">At least 10 characters required</div>
              )}
            </div>
            <div className="flex gap-12 justify-end">
              <button className="btn btn-outline" onClick={() => { setActionModal(null); setRationale(''); }}>
                Cancel
              </button>
              <button
                className={`btn ${actionModal.decision === 'approved' ? 'btn-success' : 'btn-danger'}`}
                disabled={rationale.length < 10 || acting}
                onClick={() => handleDecision(actionModal.id, actionModal.decision)}
              >
                {acting ? 'Processing...' : actionModal.decision === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
