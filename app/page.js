'use client';

import { useState, useEffect } from 'react';

export default function CatalogPage() {
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, [search, activeCategory]);

  async function fetchWorkflows() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (activeCategory) params.set('category', activeCategory);
    const res = await fetch(`/api/workflows?${params}`);
    const data = await res.json();
    setWorkflows(data.workflows || []);
    setLoading(false);
  }

  const categories = ['Engineering', 'Operations', 'Quality', 'People'];

  return (
    <div>
      <div className="page-header">
        <h1>Workflow Catalog</h1>
        <p>Browse and run AI-powered workflows for your team. Every run is proposal-first, approval-gated, and receipt-backed.</p>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search workflows by name, description, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="chip-group mb-24">
        <button
          className={`chip ${!activeCategory ? 'active' : ''}`}
          onClick={() => setActiveCategory('')}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            className={`chip ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(activeCategory === cat ? '' : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">
          <p>Loading workflows...</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No workflows found</h3>
          <p>Try adjusting your search or clearing the category filter.</p>
        </div>
      ) : (
        <div className="card-grid">
          {workflows.map(wf => (
            <a key={wf.id} href={`/workflows/${wf.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="card workflow-card">
                <div className="workflow-card-header">
                  <span className="workflow-icon">{wf.icon}</span>
                  <div>
                    <div className="workflow-card-title">{wf.name}</div>
                    <div className="workflow-card-desc">{wf.description}</div>
                  </div>
                </div>
                <div className="workflow-card-footer">
                  <span className="badge badge-executed">{wf.category}</span>
                  <span className="btn btn-outline" style={{ fontSize: '0.8125rem', padding: '6px 14px' }}>
                    View →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
