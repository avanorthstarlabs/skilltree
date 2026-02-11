export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand column */}
          <div className="footer-brand-col">
            <a href="/" className="footer-brand">
              <img src="/logo-nav.png" alt="" width="24" height="24" className="brand-icon-img" aria-hidden="true" />
              <span>SkillTree</span>
            </a>
            <p className="footer-tagline">
              The agent-native skill marketplace. Discover, purchase, and install
              executable .skill.md files. Multi-chain payments on Base + Solana.
            </p>
            <div className="footer-chain-badges">
              <div className="footer-solana-badge">
                <svg className="solana-logo" width="16" height="16" viewBox="0 0 397 311" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#sol-a)"/>
                  <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" fill="url(#sol-b)"/>
                  <path d="M332.1 120.2c-2.4-2.4-5.7-3.8-9.2-3.8H5.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#sol-c)"/>
                  <defs>
                    <linearGradient id="sol-a" x1="0" y1="0" x2="397" y2="311" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
                    </linearGradient>
                    <linearGradient id="sol-b" x1="0" y1="0" x2="397" y2="311" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
                    </linearGradient>
                    <linearGradient id="sol-c" x1="0" y1="0" x2="397" y2="311" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#00FFA3"/><stop offset="1" stopColor="#DC1FFF"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span>Solana</span>
              </div>
              <div className="footer-solana-badge">
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0052FF' }}>&#9670;</span>
                <span>Base</span>
              </div>
            </div>
          </div>

          {/* Marketplace column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Marketplace</h4>
            <a href="/" className="footer-link">Skill Catalog</a>
            <a href="/library" className="footer-link">My Library</a>
            <a href="/list-skill" className="footer-link">Sell a Skill</a>
            <a href="/stats" className="footer-link">Stats</a>
          </div>

          {/* For Agents column */}
          <div className="footer-col">
            <h4 className="footer-col-title">For Agents</h4>
            <a href="/api/v1/skills" className="footer-link">Discovery API</a>
            <a href="/api/v1/stats" className="footer-link">Stats API</a>
            <a href="#" className="footer-link">SDK (coming soon)</a>
            <a href="#" className="footer-link">Documentation</a>
          </div>

          {/* Resources column */}
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <a href="#" className="footer-link">Skill Standard Spec</a>
            <a href="#" className="footer-link">Changelog</a>
            <a href="#" className="footer-link">Farcaster</a>
            <a href="#" className="footer-link">GitHub</a>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} SkillTree. Agent-native skill economy.
          </div>
          <div className="footer-bottom-links">
            <a href="#" className="footer-bottom-link">Privacy</a>
            <a href="#" className="footer-bottom-link">Terms</a>
            <a href="#" className="footer-bottom-link">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
