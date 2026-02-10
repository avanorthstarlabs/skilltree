import './globals.css';

export const metadata = {
  title: 'Workflow Marketplace',
  description: 'A safety-first marketplace for AI-powered team workflows',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <nav className="topnav">
          <div className="topnav-inner">
            <a href="/" className="topnav-brand">
              <span className="brand-icon">⚡</span>
              <span className="brand-text">Workflow Marketplace</span>
            </a>
            <div className="topnav-links">
              <a href="/" className="nav-link">Catalog</a>
              <a href="/approvals" className="nav-link">Approvals</a>
              <a href="/receipts" className="nav-link">Receipts</a>
              <a href="/metrics" className="nav-link">Metrics</a>
            </div>
          </div>
        </nav>
        <main className="main-content">
          {children}
        </main>
      </body>
    </html>
  );
}
