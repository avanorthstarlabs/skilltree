'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

function UserMenu() {
  const [open, setOpen] = useState(false);
  const [walletSignInPending, setWalletSignInPending] = useState(null); // 'evm' | 'solana'
  const dropdownRef = useRef(null);
  const { data: session, status, update: updateSession } = useSession();

  // EVM (Base via RainbowKit)
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { disconnect: evmDisconnect } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const { signMessageAsync: evmSignMessage } = useSignMessage();

  // Solana
  const { connected: solConnected, publicKey, signMessage: solSignMessage, disconnect: solDisconnect } = useWallet();
  const { setVisible: setSolModalVisible } = useWalletModal();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Handle EVM wallet sign-in after connection
  useEffect(() => {
    if (walletSignInPending === 'evm' && evmConnected && evmAddress) {
      doWalletSignIn(evmAddress, 'evm');
      setWalletSignInPending(null);
    }
  }, [walletSignInPending, evmConnected, evmAddress]);

  // Handle Solana wallet sign-in after connection
  useEffect(() => {
    if (walletSignInPending === 'solana' && solConnected && publicKey) {
      doWalletSignIn(publicKey.toBase58(), 'solana');
      setWalletSignInPending(null);
    }
  }, [walletSignInPending, solConnected, publicKey]);

  async function doWalletSignIn(address, chain) {
    try {
      // Fetch nonce
      const nonceRes = await fetch('/api/auth/nonce');
      const { nonce } = await nonceRes.json();

      const message = `Sign in to SkillTree\n\nNonce: ${nonce}`;

      let signature;
      if (chain === 'evm') {
        signature = await evmSignMessage({ message });
      } else {
        const encoded = new TextEncoder().encode(message);
        const sigBytes = await solSignMessage(encoded);
        signature = Buffer.from(sigBytes).toString('base64');
      }

      await signIn('wallet', {
        address,
        signature,
        message,
        nonce,
        chain,
        redirect: false,
      });
    } catch (err) {
      console.error('Wallet sign-in failed:', err);
    }
  }

  function handleEvmSignIn() {
    if (evmConnected && evmAddress) {
      doWalletSignIn(evmAddress, 'evm');
    } else {
      setWalletSignInPending('evm');
      openConnectModal?.();
    }
  }

  function handleSolanaSignIn() {
    if (solConnected && publicKey) {
      doWalletSignIn(publicKey.toBase58(), 'solana');
    } else {
      setWalletSignInPending('solana');
      setSolModalVisible(true);
    }
  }

  // --- Signed in state ---
  if (session?.user) {
    const displayName = session.user.displayName || session.user.name || 'User';
    const avatarUrl = session.user.avatarUrl || session.user.image;
    const methods = session.user.authMethods || [];

    return (
      <div className="wallet-dropdown" ref={dropdownRef}>
        <button
          className="wallet-dropdown-trigger wallet-connected"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" width="20" height="20" style={{ borderRadius: '50%', marginRight: 6 }} />
          ) : (
            <span className="wallet-status-dot" />
          )}
          {displayName}
          <span className={`wallet-dropdown-arrow ${open ? 'open' : ''}`}>&#9662;</span>
        </button>

        {open && (
          <div className="wallet-dropdown-menu" role="menu">
            <div className="wallet-dropdown-section">
              <div className="wallet-dropdown-chain" style={{ gap: 6 }}>
                {methods.map(m => (
                  <span key={m} className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                    {m === 'evm' ? 'Base' : m === 'google' ? 'Google' : 'Solana'}
                  </span>
                ))}
              </div>
            </div>
            <div className="wallet-dropdown-divider" />
            <a href="/profile" className="wallet-dropdown-connect" onClick={() => setOpen(false)} style={{ textDecoration: 'none', display: 'block', textAlign: 'left' }}>
              Profile
            </a>
            <a href="/library" className="wallet-dropdown-connect" onClick={() => setOpen(false)} style={{ textDecoration: 'none', display: 'block', textAlign: 'left' }}>
              My Library
            </a>
            <div className="wallet-dropdown-divider" />
            <button
              className="wallet-dropdown-action wallet-dropdown-disconnect"
              onClick={() => {
                setOpen(false);
                if (evmConnected) evmDisconnect();
                if (solConnected) solDisconnect();
                signOut();
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Not signed in ---
  return (
    <div className="wallet-dropdown" ref={dropdownRef}>
      <button
        className="wallet-dropdown-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Sign In
        <span className={`wallet-dropdown-arrow ${open ? 'open' : ''}`}>&#9662;</span>
      </button>

      {open && (
        <div className="wallet-dropdown-menu" role="menu">
          <div className="wallet-dropdown-section">
            <button
              className="wallet-dropdown-connect"
              onClick={() => { setOpen(false); signIn('google'); }}
              style={{ width: '100%' }}
            >
              Sign in with Google
            </button>
          </div>
          <div className="wallet-dropdown-divider" />
          <div className="wallet-dropdown-section">
            <div className="wallet-dropdown-chain">
              <span className="wallet-chain-icon" style={{ color: '#0052FF', fontWeight: 700 }}>&#9670;</span>
              <span>Base Wallet</span>
            </div>
            <button
              className="wallet-dropdown-connect"
              onClick={() => { setOpen(false); handleEvmSignIn(); }}
              style={{ width: '100%' }}
            >
              Connect & Sign
            </button>
          </div>
          <div className="wallet-dropdown-divider" />
          <div className="wallet-dropdown-section">
            <div className="wallet-dropdown-chain">
              <svg className="wallet-chain-icon-svg" width="14" height="14" viewBox="0 0 397 311" fill="none" aria-hidden="true">
                <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#nm-sol-a)"/>
                <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#nm-sol-b)"/>
                <path d="M332.1 120.2c-2.4-2.4-5.7-3.8-9.2-3.8H5.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#nm-sol-c)"/>
                <defs>
                  <linearGradient id="nm-sol-a" x1="0" y1="0" x2="397" y2="311" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient>
                  <linearGradient id="nm-sol-b" x1="0" y1="0" x2="397" y2="311" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient>
                  <linearGradient id="nm-sol-c" x1="0" y1="0" x2="397" y2="311" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/></linearGradient>
                </defs>
              </svg>
              <span>Solana Wallet</span>
            </div>
            <button
              className="wallet-dropdown-connect"
              onClick={() => { setOpen(false); handleSolanaSignIn(); }}
              style={{ width: '100%' }}
            >
              Connect & Sign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Nav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: session } = useSession();

  const links = [
    { href: '/', label: 'Skills', match: (p) => p === '/' || p.startsWith('/skills') },
    { href: '/library', label: 'My Library', match: (p) => p.startsWith('/library') },
    { href: '/list-skill', label: 'Sell a Skill', match: (p) => p.startsWith('/list-skill') },
    { href: '/stats', label: 'Stats', match: (p) => p.startsWith('/stats') },
    ...(session ? [{ href: '/profile', label: 'Profile', match: (p) => p.startsWith('/profile') }] : []),
  ];

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeMenu(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen, closeMenu]);

  useEffect(() => { closeMenu(); }, [pathname, closeMenu]);

  return (
    <nav className="topnav">
      <div className="topnav-inner">
        <a href="/" className="topnav-brand">
          <img src="/logo-nav.png" alt="" width="24" height="24" className="brand-icon-img" aria-hidden="true" />
          <span className="brand-text">SkillTree</span>
        </a>

        {/* Desktop nav */}
        <div className="topnav-links topnav-desktop">
          {links.map(({ href, label, match }) => (
            <a key={href} href={href} className={`nav-link${match(pathname) ? ' active' : ''}`}>
              {label}
            </a>
          ))}
          <UserMenu />
        </div>

        {/* Hamburger button */}
        <button
          className={`hamburger${menuOpen ? ' hamburger-open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-backdrop" onClick={closeMenu} aria-hidden="true" />
      )}
      <div className={`mobile-drawer${menuOpen ? ' mobile-drawer-open' : ''}`}>
        <div className="mobile-drawer-links">
          {links.map(({ href, label, match }) => (
            <a
              key={href}
              href={href}
              className={`mobile-nav-link${match(pathname) ? ' active' : ''}`}
              onClick={closeMenu}
            >
              {label}
            </a>
          ))}
        </div>
        <div className="mobile-drawer-wallet">
          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
