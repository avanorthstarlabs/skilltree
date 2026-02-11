'use client';

import { useState, useEffect } from 'react';

export default function SkillCatalogPage() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [search, activeCategory, showFreeOnly]);

  async function fetchSkills() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (activeCategory) params.set('category', activeCategory);
      if (showFreeOnly) params.set('free', 'true');
      const res = await fetch(`/api/v1/skills?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch skills (${res.status})`);
      const data = await res.json();
      setSkills(data.skills || []);
    } catch (err) {
      setError(err.message);
      setSkills([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch('/api/v1/stats');
      if (res.ok) setStats(await res.json());
    } catch (_) {}
  }

  const categories = ['engineering', 'operations', 'web3', 'security', 'data', 'meta'];

  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            Agent-native skill marketplace
          </div>
          <h1>
            Skills that make<br />
            <span className="hero-gradient-text">agents unstoppable</span>
          </h1>
          <p>
            Discover, purchase, and install executable .skill.md files.
            Free and paid skills. Multi-chain payments on Base + Solana.
          </p>
          <div className="hero-actions">
            <a href="#catalog" className="hero-btn-primary">
              Browse Skills
            </a>
            <a href="/list-skill" className="hero-btn-secondary">
              Sell a Skill
            </a>
          </div>
        </div>

        {/* Pipeline visualization — agent purchase flow */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-pipeline-step">
            <div className="hero-step-icon hero-step-icon-configure">&#128269;</div>
            <div>
              <div className="hero-step-text">Discover</div>
              <div className="hero-step-sub">Search by capability</div>
            </div>
          </div>
          <div className="hero-connector" />
          <div className="hero-pipeline-step">
            <div className="hero-step-icon hero-step-icon-propose">&#128200;</div>
            <div>
              <div className="hero-step-text">Evaluate</div>
              <div className="hero-step-sub">Preview metadata + reviews</div>
            </div>
          </div>
          <div className="hero-connector" />
          <div className="hero-pipeline-step">
            <div className="hero-step-icon hero-step-icon-approve">&#128176;</div>
            <div>
              <div className="hero-step-text">Purchase</div>
              <div className="hero-step-sub">Pay on Base or Solana</div>
            </div>
          </div>
          <div className="hero-connector" />
          <div className="hero-pipeline-step">
            <div className="hero-step-icon hero-step-icon-execute">&#9889;</div>
            <div>
              <div className="hero-step-text">Install</div>
              <div className="hero-step-sub">Add to your agent runtime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value stat-value-accent">{stats?.total_skills || 0}</div>
          <div className="stat-label">Skills Listed</div>
        </div>
        <div className="stat-item">
          <div className="stat-value stat-value-success">{stats?.free_skills || 0}</div>
          <div className="stat-label">Free / Open Source</div>
        </div>
        <div className="stat-item">
          <div className="stat-value stat-value-warning">{stats?.total_purchases || 0}</div>
          <div className="stat-label">Total Purchases</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{stats?.unique_buyers || 0}</div>
          <div className="stat-label">Unique Agents</div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="features-grid">
        <div className="feature-card">
          <div className="feature-icon feature-icon-purple">&#129302;</div>
          <h3>Agent-Native</h3>
          <p>Built for agents first. REST API that any agent can call to discover, evaluate, purchase, and install skills — zero human required.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon feature-icon-green">&#128274;</div>
          <h3>Payment-Gated</h3>
          <p>Paid skills are locked until purchased on-chain. Free skills are fully open. SHA-256 content hashes verify integrity post-download.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon feature-icon-amber">&#9889;</div>
          <h3>Multi-Chain</h3>
          <p>Pay with $SKILL on Base or Solana. Low fees, instant confirmation. Creators earn 80% of every sale.</p>
        </div>
      </div>

      {/* Catalog Section */}
      <div id="catalog">
        <div className="section-header">
          <h2 className="page-title">Skill Catalog</h2>
        </div>

        <div className="search-bar">
          <span className="search-icon">&#128269;</span>
          <label htmlFor="catalog-search" className="sr-only">Search skills</label>
          <input
            id="catalog-search"
            type="text"
            className="search-input"
            placeholder="Search skills by name, description, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search skills"
          />
        </div>

        <div className="chip-group mb-24">
          <button
            className={`chip ${!activeCategory && !showFreeOnly ? 'active' : ''}`}
            onClick={() => { setActiveCategory(''); setShowFreeOnly(false); }}
          >
            All
          </button>
          <button
            className={`chip ${showFreeOnly ? 'active' : ''}`}
            onClick={() => { setShowFreeOnly(!showFreeOnly); setActiveCategory(''); }}
          >
            Free
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => { setActiveCategory(activeCategory === cat ? '' : cat); setShowFreeOnly(false); }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
            <div className="error-banner-icon">&#9888;</div>
            <div className="error-banner-content">
              <h3 className="error-banner-heading">Failed to load skills</h3>
              <p className="error-banner-message">{error}</p>
            </div>
            <button className="btn btn-primary" onClick={fetchSkills}>Retry</button>
          </div>
        ) : skills.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">&#128269;</div>
            <h3 className="empty-state-heading">No skills found</h3>
            <p className="empty-state-description">Try adjusting your search or clearing filters.</p>
          </div>
        ) : (
          <div className="card-grid">
            {skills.map(skill => (
              <a key={skill.slug} href={`/skills/${skill.slug}`} className="card-link">
                <div className="card workflow-card">
                  <div className="workflow-card-header">
                    <span className="workflow-icon">{skill.icon}</span>
                    <div>
                      <div className="workflow-card-title">{skill.name}</div>
                      <div className="workflow-card-desc">{skill.description}</div>
                    </div>
                  </div>
                  <div className="workflow-card-footer">
                    <div className="skill-card-meta">
                      <span className="badge badge-executed">{skill.category}</span>
                      {skill.isFree ? (
                        <span className="badge badge-approved">FREE</span>
                      ) : (
                        <span className="skill-price">{skill.price.amount} {skill.price.currency}</span>
                      )}
                    </div>
                    <span className="btn btn-outline btn-sm">View &rarr;</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
