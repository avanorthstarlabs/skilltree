'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function SkillDetailPage() {
  const { slug } = useParams();
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    fetchSkill();
  }, [slug]);

  async function fetchSkill() {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/skills/${slug}`);
      if (!res.ok) throw new Error(res.status === 404 ? 'Skill not found' : 'Failed to load skill');
      setSkill(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyApiExample() {
    const example = `curl -s ${window.location.origin}/api/v1/skills/${slug}/preview`;
    navigator.clipboard.writeText(example);
    setCopyFeedback('Copied!');
    setTimeout(() => setCopyFeedback(''), 2000);
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="skeleton skeleton-title" style={{ width: '60%', marginBottom: 16 }} />
        <div className="skeleton skeleton-text" style={{ width: '80%', marginBottom: 8 }} />
        <div className="skeleton skeleton-text" style={{ width: '70%' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-page">
        <div className="error-banner" role="alert">
          <div className="error-banner-icon">&#9888;</div>
          <div className="error-banner-content">
            <h3 className="error-banner-heading">{error}</h3>
            <p className="error-banner-message">The skill &quot;{slug}&quot; could not be loaded.</p>
          </div>
          <a href="/" className="btn btn-primary">Back to Catalog</a>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Header */}
      <div className="skill-detail-header">
        <div className="skill-detail-icon">{skill.icon}</div>
        <div>
          <h1 className="skill-detail-title">{skill.name}</h1>
          <p className="skill-detail-desc">{skill.description}</p>
          <div className="skill-detail-meta">
            <span className="badge badge-executed">{skill.category}</span>
            {skill.isFree ? (
              <span className="badge badge-approved">FREE</span>
            ) : (
              <span className="skill-price-large">{skill.price.amount} {skill.price.currency}</span>
            )}
            <span className="skill-detail-version">v{skill.version}</span>
            {skill.author_name && (
              <span className="skill-detail-author">by {skill.author_name}</span>
            )}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="skill-detail-grid">
        {/* Left: Info */}
        <div className="skill-detail-main">
          {/* Tags */}
          <section className="skill-section">
            <h3 className="skill-section-title">Tags</h3>
            <div className="chip-group">
              {(skill.tags || []).map(tag => (
                <span key={tag} className="chip">{tag}</span>
              ))}
            </div>
          </section>

          {/* Inputs */}
          <section className="skill-section">
            <h3 className="skill-section-title">Inputs</h3>
            <div className="skill-params-list">
              {(skill.inputs || []).map(input => (
                <div key={input.name} className="skill-param">
                  <div className="skill-param-header">
                    <code className="skill-param-name">{input.name}</code>
                    <span className="skill-param-type">{input.type}</span>
                    {input.required && <span className="badge badge-pending">required</span>}
                  </div>
                  <p className="skill-param-desc">{input.description}</p>
                  {input.options && (
                    <div className="skill-param-options">
                      Options: {input.options.map(o => <code key={o} className="skill-option">{o}</code>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Outputs */}
          <section className="skill-section">
            <h3 className="skill-section-title">Outputs</h3>
            <div className="skill-params-list">
              {(skill.outputs || []).map(output => (
                <div key={output.name} className="skill-param">
                  <div className="skill-param-header">
                    <code className="skill-param-name">{output.name}</code>
                    <span className="skill-param-type">{output.type}</span>
                  </div>
                  <p className="skill-param-desc">{output.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Skill body (only shown for free skills or if access is full/purchased) */}
          {skill.body && (
            <section className="skill-section">
              <h3 className="skill-section-title">Skill Instructions (Preview)</h3>
              <div className="skill-body-preview">
                <pre className="skill-body-content">{skill.body}</pre>
              </div>
            </section>
          )}

          {!skill.body && skill.access === 'preview' && (
            <section className="skill-section">
              <div className="skill-locked-banner">
                <span className="skill-locked-icon">&#128274;</span>
                <div>
                  <h4>Skill instructions are locked</h4>
                  <p>Purchase this skill to access the full executable instructions.</p>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Right: Sidebar */}
        <div className="skill-detail-sidebar">
          {/* Compatibility */}
          <div className="card skill-sidebar-card">
            <h4 className="skill-sidebar-title">Compatibility</h4>
            {skill.compatibility?.runtimes && (
              <div className="skill-sidebar-field">
                <span className="skill-sidebar-label">Runtimes</span>
                <div className="chip-group chip-group-sm">
                  {skill.compatibility.runtimes.map(r => (
                    <span key={r} className="chip chip-sm">{r}</span>
                  ))}
                </div>
              </div>
            )}
            {skill.compatibility?.tools_required && skill.compatibility.tools_required.length > 0 && (
              <div className="skill-sidebar-field">
                <span className="skill-sidebar-label">Required Tools</span>
                <div className="chip-group chip-group-sm">
                  {skill.compatibility.tools_required.map(t => (
                    <span key={t} className="chip chip-sm">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {skill.compatibility?.min_context && (
              <div className="skill-sidebar-field">
                <span className="skill-sidebar-label">Min Context</span>
                <span>{skill.compatibility.min_context.toLocaleString()} tokens</span>
              </div>
            )}
          </div>

          {/* Payment Chains */}
          <div className="card skill-sidebar-card">
            <h4 className="skill-sidebar-title">Payment</h4>
            <div className="skill-sidebar-field">
              <span className="skill-sidebar-label">Accepted Chains</span>
              <div className="chip-group chip-group-sm">
                {(skill.price?.chains || []).map(c => (
                  <span key={c} className="chip chip-sm">{c}</span>
                ))}
              </div>
            </div>
            <div className="skill-sidebar-field">
              <span className="skill-sidebar-label">Revenue Split</span>
              <span>80% Creator / 10% Platform / 10% Treasury</span>
            </div>
          </div>

          {/* Agent API */}
          <div className="card skill-sidebar-card">
            <h4 className="skill-sidebar-title">Agent API</h4>
            <div className="skill-api-example">
              <code className="skill-api-code">GET /api/v1/skills/{slug}/preview</code>
              <button className="btn btn-outline btn-sm" onClick={copyApiExample}>
                {copyFeedback || 'Copy curl'}
              </button>
            </div>
          </div>

          {/* Content Hash */}
          <div className="card skill-sidebar-card">
            <h4 className="skill-sidebar-title">Integrity</h4>
            <div className="skill-sidebar-field">
              <span className="skill-sidebar-label">Content Hash (SHA-256)</span>
              <code className="skill-hash">{skill.contentHash}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
