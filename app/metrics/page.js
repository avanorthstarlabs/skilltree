'use client';

import { useState, useEffect } from 'react';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/metrics')
      .then(r => r.json())
      .then(data => { setMetrics(data.metrics); setLoading(false); });
  }, []);

  if (loading) return <div className="empty-state"><p>Loading metrics...</p></div>;

  const m = metrics || {};

  return (
    <div>
      <div className="page-header">
        <h1>Metrics Dashboard</h1>
        <p>Track workflow adoption, approval rates, and execution outcomes.</p>
      </div>

      <div className="card-grid mb-24" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        <div className="card metric-card">
          <div className="metric-value">{m.total_proposals || 0}</div>
          <div className="metric-label">Total Proposals</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value" style={{ color: 'var(--color-pending)' }}>{m.pending || 0}</div>
          <div className="metric-label">Pending</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value" style={{ color: 'var(--color-approved)' }}>{m.approval_rate || 0}%</div>
          <div className="metric-label">Approval Rate</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value" style={{ color: 'var(--color-executed)' }}>{m.executed || 0}</div>
          <div className="metric-label">Executed</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value" style={{ color: 'var(--color-rejected)' }}>{m.rejected || 0}</div>
          <div className="metric-label">Rejected</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{m.total_receipts || 0}</div>
          <div className="metric-label">Total Receipts</div>
        </div>
      </div>

      {m.by_workflow && Object.keys(m.by_workflow).length > 0 && (
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: 16 }}>By Workflow</h3>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Workflow</th>
                  <th>Total Proposals</th>
                  <th>Executed</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(m.by_workflow).map(([name, stats]) => (
                  <tr key={name}>
                    <td className="font-semibold">{name}</td>
                    <td>{stats.total}</td>
                    <td>{stats.executed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!m.by_workflow || Object.keys(m.by_workflow).length === 0) && m.total_proposals === 0 && (
        <div className="card">
          <div className="empty-state" style={{ padding: '40px 24px' }}>
            <div className="empty-state-icon">📊</div>
            <h3>No data yet</h3>
            <p>Submit and approve some workflow runs to see metrics here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
