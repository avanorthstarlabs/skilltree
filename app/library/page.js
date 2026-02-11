'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const [address, setAddress] = useState('');
  const [library, setLibrary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-fetch when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchSessionLibrary();
    }
  }, [status, session]);

  async function fetchSessionLibrary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/library');
      if (!res.ok) throw new Error('Failed to load library');
      setLibrary(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAddressLibrary(e) {
    e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/library?address=${encodeURIComponent(address.trim())}`);
      if (!res.ok) throw new Error('Failed to load library');
      setLibrary(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isAuthenticated = status === 'authenticated';

  return (
    <div>
      <div className="section-header">
        <h2 className="page-title">My Skill Library</h2>
        <p className="page-subtitle">
          {isAuthenticated
            ? 'Your purchased skills across all linked wallets.'
            : 'Sign in to auto-detect your library, or search by wallet address.'}
        </p>
      </div>

      {/* Manual address lookup (shown when not signed in, or as a secondary option) */}
      {!isAuthenticated && (
        <form onSubmit={fetchAddressLibrary} className="library-search-form">
          <div className="search-bar">
            <span className="search-icon">&#128179;</span>
            <label htmlFor="wallet-address" className="sr-only">Wallet address</label>
            <input
              id="wallet-address"
              type="text"
              className="search-input"
              placeholder="Enter wallet address (0x... or Solana address)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !address.trim()}>
            {loading ? 'Loading...' : 'View Library'}
          </button>
        </form>
      )}

      {/* Loading state for authenticated auto-fetch */}
      {isAuthenticated && loading && !library && (
        <div className="empty-state">
          <div className="empty-state-icon">&#8987;</div>
          <p className="empty-state-description">Loading your library...</p>
        </div>
      )}

      {error && (
        <div className="error-banner" role="alert">
          <div className="error-banner-icon">&#9888;</div>
          <div className="error-banner-content">
            <h3 className="error-banner-heading">Error</h3>
            <p className="error-banner-message">{error}</p>
          </div>
        </div>
      )}

      {library && library.skills.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">&#128218;</div>
          <h3 className="empty-state-heading">No skills purchased yet</h3>
          <p className="empty-state-description">
            Browse the <a href="/">skill catalog</a> to find skills for your agent.
          </p>
        </div>
      )}

      {library && library.skills.length > 0 && (
        <>
          <div className="library-header">
            <span className="library-count">{library.count} skill{library.count !== 1 ? 's' : ''} owned</span>
          </div>
          <div className="card-grid">
            {library.skills.map(item => (
              <a key={item.id} href={`/skills/${item.skill_slug}`} className="card-link">
                <div className="card workflow-card">
                  <div className="workflow-card-header">
                    <span className="workflow-icon">{item.skill?.icon}</span>
                    <div>
                      <div className="workflow-card-title">{item.skill?.name}</div>
                      <div className="workflow-card-desc">{item.skill?.description}</div>
                    </div>
                  </div>
                  <div className="workflow-card-footer">
                    <div className="skill-card-meta">
                      <span className="badge badge-executed">{item.skill?.category}</span>
                      <span className="badge badge-approved">OWNED</span>
                      <span className="skill-purchase-chain">{item.chain}</span>
                    </div>
                    <span className="btn btn-outline btn-sm">View &rarr;</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
