'use client';

import { useState, useEffect, useCallback } from 'react';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/metrics')
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch metrics (${r.status})`);
        return r.json();
      })
      .then(data => {
        setMetrics(data.metrics);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Metrics Dashboard</h1>
          <p className="page-subtitle">Track workflow adoption, approval rates, and execution outcomes.</p>
        </div>
        <div className="metric-card-grid mb-24">
          {[...Array(6)].map((_, i) => (
            <div className="card metric-card" key={i}>
              <div className="skeleton skeleton-text" />
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Metrics Dashboard</h1>
          <p className="page-subtitle">Track workflow adoption, approval rates, and execution outcomes.</p>
        </div>
        <div className="error-banner">
          <div className="error-banner-icon">&#9888;</div>
          <div className="error-banner-content">
            <div className="error-banner-heading">Error loading metrics</div>
            <div className="error-banner-message">{error}</div>
          </div>
          <button className="btn btn-primary" onClick={fetchMetrics}>Retry</button>
        </div>
      </div>
    );
  }

  const m = metrics || {};

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Metrics Dashboard</h1>
        <p className="page-subtitle">Track workflow adoption, approval rates, and execution outcomes.</p>
      </div>

      <div className="metric-card-grid mb-24">
        <div className="card metric-card">
          <div className="metric-value">{m.total_proposals || 0}</div>
          <div className="metric-label">Total Proposals</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value metric-value-pending">{m.pending || 0}</div>
          <div className="metric-label">Pending</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value metric-value-approved">{m.approval_rate || 0}%</div>
          <div className="metric-label">Approval Rate</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value metric-value-executed">{m.executed || 0}</div>
          <div className="metric-label">Executed</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value metric-value-rejected">{m.rejected || 0}</div>
          <div className="metric-label">Rejected</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{m.total_receipts || 0}</div>
          <div className="metric-label">Total Receipts</div>
        </div>
      </div>

      {m.by_workflow && Object.keys(m.by_workflow).length > 0 && (
        <div className="card">
          <h3 className="card-section-title">By Workflow</h3>
          <div className="table-container">
            <table className="data-table">
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
          <div className="empty-state">
            <div className="empty-state-icon">&#128202;</div>
            <h3>No data yet</h3>
            <p>Submit and approve some workflow runs to see metrics here.</p>
          </div>
        </div>
      )}
    </div>
  );
}
