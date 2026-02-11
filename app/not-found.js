export default function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Page not found</h1>
      <p className="not-found-desc">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="not-found-actions">
        <a href="/" className="btn btn-primary">Back to Catalog</a>
        <a href="/approvals" className="btn btn-outline">View Approvals</a>
      </div>
    </div>
  );
}
