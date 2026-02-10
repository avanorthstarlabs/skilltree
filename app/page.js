'use client';

import { useState, useEffect } from 'react';

export default function CatalogPage() {
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWorkflows();
  }, [search, activeCategory]);

  async function fetchWorkflows() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeCategory) params.set('category', activeCategory);
      const res = await fetch(`/api/workflows?${params}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch workflows (${res.status})`);
      }
      const data = await res.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while loading workflows.');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }

  const categories = ['Engineering', 'Operations', 'Quality', 'People'];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Workflow Catalog</h1>
        <p className="page-subtitle">Browse and run AI-powered workflows for your team. Every run is proposal-first, approval-gated, and receipt-backed.</p>
      </div>

      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <label htmlFor="catalog-search" className="sr-only">Search workflows</label>
        <input
          id="catalog-search"
          type="text"
          className="search-input"
          placeholder="Search workflows by name, description, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search workflows by name, description, or tag"
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
        <div className="card-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card workflow-card skeleton-card-wrapper" aria-hidden="true">
              <div className="workflow-card-header">
                <div className="skeleton skeleton-icon" />
                <div className="skeleton-card-text">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-text-short" />
                </div>
              </div>
              <div className="workflow-card-footer">
                <div className="skeleton skeleton-badge" />
                <div className="skeleton skeleton-button" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="error-banner" role="alert">
          <div className="error-banner-icon">⚠️</div>
          <div className="error-banner-content">
            <h3 className="error-banner-heading">Failed to load workflows</h3>
            <p className="error-banner-message">{error}</p>
          </div>
          <button className="btn btn-primary" onClick={fetchWorkflows}>
            Retry
          </button>
        </div>
      ) : workflows.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3 className="empty-state-heading">No workflows found</h3>
          <p className="empty-state-description">Try adjusting your search or clearing the category filter.</p>
        </div>
      ) : (
        <div className="card-grid">
          {workflows.map(wf => (
            <a key={wf.id} href={`/workflows/${wf.slug}`} className="card-link">
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
                  <span className="btn btn-outline btn-sm">
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
