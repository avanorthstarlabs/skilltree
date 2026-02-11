'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAccount, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export default function ProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [linkingWallet, setLinkingWallet] = useState(null);

  // EVM
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync: evmSignMessage } = useSignMessage();

  // Solana
  const { connected: solConnected, publicKey, signMessage: solSignMessage } = useWallet();
  const { setVisible: setSolModalVisible } = useWalletModal();

  useEffect(() => {
    if (status === 'authenticated') fetchProfile();
    if (status === 'unauthenticated') setLoading(false);
  }, [status]);

  // Handle wallet linking after connect
  useEffect(() => {
    if (linkingWallet === 'evm' && evmConnected && evmAddress) {
      doLinkWallet(evmAddress, 'evm');
      setLinkingWallet(null);
    }
  }, [linkingWallet, evmConnected, evmAddress]);

  useEffect(() => {
    if (linkingWallet === 'solana' && solConnected && publicKey) {
      doLinkWallet(publicKey.toBase58(), 'solana');
      setLinkingWallet(null);
    }
  }, [linkingWallet, solConnected, publicKey]);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/v1/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setNameInput(data.user.display_name || '');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveName() {
    try {
      const res = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: nameInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setEditingName(false);
        await updateSession();
      }
    } catch (err) {
      console.error('Failed to save name:', err);
    }
  }

  async function doLinkWallet(address, chain) {
    try {
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();

      const message = `Link wallet to SkillTree\n\nNonce: ${nonce}`;

      let signature;
      if (chain === 'evm') {
        signature = await evmSignMessage({ message });
      } else {
        const encoded = new TextEncoder().encode(message);
        const sigBytes = await solSignMessage(encoded);
        signature = Buffer.from(sigBytes).toString('base64');
      }

      const res = await fetch('/api/v1/profile/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, signature, message, nonce, chain }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        await updateSession();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to link wallet');
      }
    } catch (err) {
      console.error('Failed to link wallet:', err);
    }
  }

  function handleLinkEvm() {
    if (evmConnected && evmAddress) {
      doLinkWallet(evmAddress, 'evm');
    } else {
      setLinkingWallet('evm');
      openConnectModal?.();
    }
  }

  function handleLinkSolana() {
    if (solConnected && publicKey) {
      doLinkWallet(publicKey.toBase58(), 'solana');
    } else {
      setLinkingWallet('solana');
      setSolModalVisible(true);
    }
  }

  async function handleUnlink(provider) {
    if (!confirm(`Unlink ${provider === 'evm' ? 'Base wallet' : provider === 'solana' ? 'Solana wallet' : 'Google'}?`)) return;
    try {
      const res = await fetch('/api/v1/profile/unlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        await updateSession();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to unlink');
      }
    } catch (err) {
      console.error('Failed to unlink:', err);
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div>
        <div className="section-header">
          <h2 className="page-title">Profile</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">&#8987;</div>
          <p className="empty-state-description">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <div className="section-header">
          <h2 className="page-title">Profile</h2>
          <p className="page-subtitle">Sign in to manage your profile and connected accounts.</p>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">&#128274;</div>
          <h3 className="empty-state-heading">Not signed in</h3>
          <p className="empty-state-description">
            Use the Sign In button in the navigation bar to get started.
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <div className="section-header">
          <h2 className="page-title">Profile</h2>
        </div>
        <div className="error-banner" role="alert">
          <div className="error-banner-icon">&#9888;</div>
          <div className="error-banner-content">
            <p className="error-banner-message">Failed to load profile.</p>
          </div>
        </div>
      </div>
    );
  }

  const methods = profile.auth_methods || {};
  const methodCount = Object.keys(methods).length;

  return (
    <div>
      <div className="section-header">
        <h2 className="page-title">Profile</h2>
        <p className="page-subtitle">Manage your identity and connected accounts.</p>
      </div>

      {/* Identity Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" width="48" height="48" style={{ borderRadius: '50%' }} />
          ) : (
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-2, #2a2a2a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>
              &#128100;
            </div>
          )}
          <div style={{ flex: 1 }}>
            {editingName ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  maxLength={50}
                  className="search-input"
                  style={{ flex: 1, padding: '0.4rem 0.75rem' }}
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
                />
                <button className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
                <button className="btn btn-outline btn-sm" onClick={() => setEditingName(false)}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem' }}>{profile.display_name}</strong>
                <button className="btn btn-outline btn-sm" onClick={() => { setNameInput(profile.display_name); setEditingName(true); }}>Edit</button>
              </div>
            )}
            {profile.email && <div style={{ color: 'var(--text-muted, #888)', fontSize: '0.875rem', marginTop: 2 }}>{profile.email}</div>}
          </div>
        </div>
        <div style={{ color: 'var(--text-muted, #888)', fontSize: '0.8rem' }}>
          Member since {new Date(profile.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Connected Accounts Section */}
      <h3 style={{ marginBottom: '0.75rem' }}>Connected Accounts</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Google */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>G</span>
            <div>
              <strong>Google</strong>
              {methods.google ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>{methods.google.email}</div>
              ) : null}
            </div>
          </div>
          {methods.google ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-approved">Connected</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleUnlink('google')}
                disabled={methodCount <= 1}
                title={methodCount <= 1 ? 'Cannot unlink last auth method' : ''}
              >
                Unlink
              </button>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => { /* Google linking would require re-auth */ alert('To link Google, sign out and sign in with Google, then link your wallet.'); }}>
              Connect Google
            </button>
          )}
        </div>

        {/* EVM / Base */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: '#0052FF', fontWeight: 700, fontSize: '1.25rem' }}>&#9670;</span>
            <div>
              <strong>Base (EVM)</strong>
              {methods.evm ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)', fontFamily: 'monospace' }}>
                  {methods.evm.address.slice(0, 6)}...{methods.evm.address.slice(-4)}
                </div>
              ) : null}
            </div>
          </div>
          {methods.evm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-approved">Connected</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleUnlink('evm')}
                disabled={methodCount <= 1}
                title={methodCount <= 1 ? 'Cannot unlink last auth method' : ''}
              >
                Unlink
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleLinkEvm}>
              Connect & Sign
            </button>
          )}
        </div>

        {/* Solana */}
        <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>&#9788;</span>
            <div>
              <strong>Solana</strong>
              {methods.solana ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #888)', fontFamily: 'monospace' }}>
                  {methods.solana.address.slice(0, 4)}...{methods.solana.address.slice(-4)}
                </div>
              ) : null}
            </div>
          </div>
          {methods.solana ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-approved">Connected</span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => handleUnlink('solana')}
                disabled={methodCount <= 1}
                title={methodCount <= 1 ? 'Cannot unlink last auth method' : ''}
              >
                Unlink
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleLinkSolana}>
              Connect & Sign
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
