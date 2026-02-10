'use client';

import { useState, useEffect } from 'react';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  async function fetchReceipts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/receipts');
      if (!res.ok) throw new Error(`Failed to load receipts (${res.status})`);
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Receipts</h1>
        <p>Audit log of all executed workflow runs with signed output payloads.</p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-16">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" aria-hidden="true">
              <div className="flex items-center justify-between mb-16">
                <div className="flex flex-col gap-8">
                  <div className="skeleton skeleton-text" style={{}} />
                  <div className="skeleton skeleton-text-short" style={{}} />
                </div>
                <div className="flex items-center gap-12">
                  <div className="skeleton skeleton-badge" style={{}} />
                  <div className="skeleton skeleton-text-short" style={{}} />
                </div>
              </div>
              <div className="skeleton skeleton-button" style={{}} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="error-state" role="alert">
          <div className="error-state-icon">⚠️</div>
          <h3>Failed to Load Receipts</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchReceipts}>
            Retry Loading
          </button>
        </div>
      ) : receipts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <h3>No receipts yet</h3>
          <p>Receipts appear here after proposals are approved and executed.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {receipts.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between mb-16">
                <div>
                  <div className="font-semibold">{r.workflow_name || 'Workflow Execution'}</div>
                  <div className="text-xs text-muted">Receipt: {r.id.slice(0, 8)}... | Proposal: {r.proposal_id.slice(0, 8)}...</div>
                </div>
                <div className="flex items-center gap-12">
                  <span className={`badge ${r.run_status === 'success' ? 'badge-approved' : 'badge-rejected'}`}>
                    {r.run_status}
                  </span>
                  <span className="text-sm text-muted">{new Date(r.created_at).toLocaleString()}</span>
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                aria-expanded={expanded === r.id}
                aria-controls={`receipt-detail-${r.id}`}
              >
                {expanded === r.id ? 'Hide Output ▲' : 'View Output ▼'}
              </button>
              {expanded === r.id && (
                <div className="mt-16" id={`receipt-detail-${r.id}`}>
                  <div className="json-viewer">
                    <pre>{JSON.stringify(r.output_payload, null, 2)}</pre>
                  </div>
                  {r.signed_intent && (
                    <div className="mt-16">
                      <div className="text-xs text-muted mb-16">Signed Intent (SHA-256)</div>
                      <code className="code-inline text-xs">
                        {r.signed_intent.signature}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
