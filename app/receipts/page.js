'use client';

import { useState, useEffect } from 'react';

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch('/api/receipts')
      .then(r => r.json())
      .then(data => { setReceipts(data.receipts || []); setLoading(false); });
  }, []);

  if (loading) return <div className="empty-state"><p>Loading receipts...</p></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Receipts</h1>
        <p>Audit log of all executed workflow runs with signed output payloads.</p>
      </div>

      {receipts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🧾</div>
          <h3>No receipts yet</h3>
          <p>Receipts appear here after proposals are approved and executed.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                {expanded === r.id ? 'Hide Output ▲' : 'View Output ▼'}
              </button>
              {expanded === r.id && (
                <div className="mt-16">
                  <div className="json-viewer">
                    <pre>{JSON.stringify(r.output_payload, null, 2)}</pre>
                  </div>
                  {r.signed_intent && (
                    <div className="mt-16">
                      <div className="text-xs text-muted mb-16">Signed Intent (SHA-256)</div>
                      <code className="text-xs" style={{
                        background: '#f3f4f6', padding: '4px 8px',
                        borderRadius: 4, wordBreak: 'break-all'
                      }}>
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
