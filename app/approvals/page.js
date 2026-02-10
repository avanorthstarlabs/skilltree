'use client';

import { useState, useEffect } from 'react';

export default function ApprovalsPage() {
  const [proposals, setProposals] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState(null);
  const [rationale, setRationale] = useState('');
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, [filter]);

  async function fetchProposals() {
    setLoading(true);
    const params = filter ? `?status=${filter}` : '';
    const res = await fetch(`/api/proposals${params}`);
    const data = await res.json();
    setProposals(data.proposals || []);
    setLoading(false);
  }

  async function handleDecision(proposalId, decision) {
    if (rationale.length < 10) return;
    setActing(true);
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: proposalId,
        decision,
        approved_by: 'operator@local',
        rationale,
      }),
    });
    setActionModal(null);
    setRationale('');
    setActing(false);
    fetchProposals();
  }

  const statusFilters = ['pending', 'approved', 'rejected', 'executed', ''];

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
            className={`chip ${filter === s ? 'active' : ''}`}
            onClick={() => setFilter(s)}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading proposals...</p></div>
      ) : proposals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
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
                            className="btn btn-success"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => setActionModal({ id: p.id, decision: 'approved' })}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => setActionModal({ id: p.id, decision: 'rejected' })}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <a
                          href={`/approvals/${p.id}`}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
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
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <div className="card" style={{ maxWidth: 480, width: '90%' }}>
            <h3 style={{ marginBottom: 16 }}>
              {actionModal.decision === 'approved' ? '✅ Approve' : '❌ Reject'} Proposal
            </h3>
            <div className="form-group">
              <label className="form-label">Rationale (min 10 characters)</label>
              <textarea
                className="form-textarea"
                placeholder="Explain your decision..."
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
              />
              {rationale.length > 0 && rationale.length < 10 && (
                <div className="form-error">At least 10 characters required</div>
              )}
            </div>
            <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
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
