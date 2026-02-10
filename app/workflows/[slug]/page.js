'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    fetch(`/api/workflows/${params.slug}`)
      .then(r => r.json())
      .then(data => {
        setWorkflow(data.workflow);
        if (data.workflow?.inputs_schema?.properties) {
          const defaults = {};
          for (const [key, prop] of Object.entries(data.workflow.inputs_schema.properties)) {
            if (prop.default !== undefined) defaults[key] = prop.default;
          }
          setFormData(defaults);
        }
      });
  }, [params.slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);

    const res = await fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_slug: workflow.slug,
        input_payload: formData,
        created_by: 'operator@local',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrors(data.details || [data.error]);
      setSubmitting(false);
      return;
    }

    setSubmitted(data.proposal);
    setSubmitting(false);
  }

  function renderField(key, prop) {
    const value = formData[key] ?? '';

    if (prop.type === 'enum' && prop.options) {
      return (
        <select
          className="form-select"
          value={value}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        >
          <option value="">Select {prop.label || key}...</option>
          {prop.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (prop.type === 'boolean') {
      return (
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
          />
          {prop.label || key}
        </label>
      );
    }

    if (prop.multiline) {
      return (
        <textarea
          className="form-textarea"
          placeholder={prop.placeholder || ''}
          value={value}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        />
      );
    }

    return (
      <input
        type="text"
        className="form-input"
        placeholder={prop.placeholder || ''}
        value={value}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
      />
    );
  }

  if (!workflow) {
    return <div className="empty-state"><p>Loading workflow...</p></div>;
  }

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <h1>Proposal Submitted</h1>
          <p>Your run request has been submitted for approval.</p>
        </div>
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="flex items-center gap-12 mb-16">
            <span className="workflow-icon">{workflow.icon}</span>
            <div>
              <div className="font-semibold">{workflow.name}</div>
              <span className="badge badge-pending">Pending Approval</span>
            </div>
          </div>
          <p className="text-sm text-muted mb-16">
            Proposal ID: <code>{submitted.id}</code>
          </p>
          <div className="flex gap-12">
            <a href="/approvals" className="btn btn-primary">Go to Approvals</a>
            <a href="/" className="btn btn-outline">Back to Catalog</a>
          </div>
        </div>
      </div>
    );
  }

  const schema = workflow.inputs_schema;
  const properties = schema?.properties || {};

  return (
    <div>
      <div className="page-header">
        <div className="flex items-center gap-16 mb-16">
          <span style={{ fontSize: '2.5rem' }}>{workflow.icon}</span>
          <div>
            <h1>{workflow.name}</h1>
            <div className="flex items-center gap-8 mt-8">
              <span className="badge badge-executed">{workflow.category}</span>
              {workflow.tags.map(t => (
                <span key={t} className="chip" style={{ cursor: 'default' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <p>{workflow.description}</p>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: 24 }}>Configure & Submit Run</h2>

        {errors.length > 0 && (
          <div style={{
            background: 'var(--color-rejected-bg)',
            border: '1px solid var(--color-rejected)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            marginBottom: 20,
          }}>
            {errors.map((err, i) => (
              <div key={i} className="text-sm" style={{ color: 'var(--color-rejected)' }}>{err}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {Object.entries(properties).map(([key, prop]) => (
            <div key={key} className="form-group">
              {prop.type !== 'boolean' && (
                <label className="form-label">
                  {prop.label || key}
                  {schema.required?.includes(key) && <span style={{ color: 'var(--color-rejected)' }}> *</span>}
                </label>
              )}
              {renderField(key, prop)}
              {prop.minLength && (
                <div className="form-hint">Minimum {prop.minLength} characters</div>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ marginTop: 8 }}
          >
            {submitting ? 'Submitting...' : 'Submit Run Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
}
