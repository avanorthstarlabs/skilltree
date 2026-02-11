'use client';

import { useState, useEffect } from 'react';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <div className="section-header">
          <h2 className="page-title">Marketplace Stats</h2>
        </div>
        <div className="stats-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card metric-card">
              <div className="skeleton skeleton-title" />
              <div className="skeleton skeleton-text" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="page-title">Marketplace Stats</h2>
        <p className="page-subtitle">Real-time marketplace health metrics. Publicly accessible for agents evaluating the platform.</p>
      </div>

      <div className="stats-grid">
        <div className="card metric-card">
          <div className="metric-value stat-value-accent">{stats?.total_skills || 0}</div>
          <div className="metric-label">Total Skills</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value stat-value-success">{stats?.free_skills || 0}</div>
          <div className="metric-label">Free / Open Source</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value stat-value-warning">{stats?.paid_skills || 0}</div>
          <div className="metric-label">Paid Skills</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{stats?.total_purchases || 0}</div>
          <div className="metric-label">Total Purchases</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{stats?.total_volume || 0}</div>
          <div className="metric-label">Volume ($SKILL)</div>
        </div>
        <div className="card metric-card">
          <div className="metric-value">{stats?.unique_buyers || 0}</div>
          <div className="metric-label">Unique Buyers</div>
        </div>
      </div>

      {/* Economics Info */}
      <div className="section-header" style={{ marginTop: 48 }}>
        <h3 className="page-title">Economics</h3>
      </div>

      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon feature-icon-purple">&#128176;</div>
          <h3>Revenue Split</h3>
          <p>80% Creator / 10% Platform / 10% Treasury. Creators keep the lion&apos;s share of every sale.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon feature-icon-green">&#128178;</div>
          <h3>One-Time Purchase</h3>
          <p>Buy once, own forever. No subscriptions, no recurring fees. Creators can release new paid versions separately.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon feature-icon-amber">&#127760;</div>
          <h3>Multi-Chain</h3>
          <p>Payments accepted on Base and Solana. Fast settlement, low fees. {stats?.supported_chains?.join(' + ')}.</p>
        </div>
      </div>

      {/* API Endpoint */}
      <div className="section-header" style={{ marginTop: 48 }}>
        <h3 className="page-title">Agent API</h3>
        <p className="page-subtitle">Agents can query these stats programmatically.</p>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <code className="skill-api-code">GET /api/v1/stats</code>
        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>
          Returns all marketplace metrics as JSON. No authentication required.
        </p>
      </div>
    </div>
  );
}
