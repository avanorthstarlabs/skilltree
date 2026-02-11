'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [workflow, setWorkflow] = useState(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const fetchWorkflow = useCallback(() => {
    setError(null);
    setWorkflow(null);
    fetch(`/api/v1/workflows/${params.slug}`)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to load workflow (${r.status})`);
        return r.json();
      })
      .then(data => {
        setWorkflow(data.workflow);
        if (data.workflow?.inputs_schema?.properties) {
          const defaults = {};
          for (const [key, prop] of Object.entries(data.workflow.inputs_schema.properties)) {
            if (prop.default !== undefined) defaults[key] = prop.default;
          }
          setFormData(defaults);
        }
      })
      .catch(e => {
        setError(e.message);
      });
  }, [params.slug]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  function validateFields() {
    const schema = workflow.inputs_schema;
    const properties = schema?.properties || {};
    const required = schema?.required || [];
    const newFieldErrors = {};

    for (const key of required) {
      const val = formData[key];
      if (val === undefined || val === null || val === '') {
        const prop = properties[key];
        const label = prop?.label || key;
        newFieldErrors[key] = `${label} is required`;
      }
    }

    for (const [key, prop] of Object.entries(properties)) {
      if (newFieldErrors[key]) continue;
      const val = formData[key];
      if (prop.minLength && typeof val === 'string' && val.length > 0 && val.length < prop.minLength) {
        newFieldErrors[key] = `Minimum ${prop.minLength} characters required`;
      }
    }

    setFieldErrors(newFieldErrors);
    return Object.keys(newFieldErrors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setErrors([]);
    setFieldErrors({});

    if (!validateFields()) {
      setSubmitting(false);
      return;
    }

    const res = await fetch('/api/v1/proposals', {
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
          id={`field-${key}`}
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
        <label className="checkbox-label" htmlFor={`field-${key}`}>
          <input
            id={`field-${key}`}
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
          id={`field-${key}`}
          className="form-textarea"
          placeholder={prop.placeholder || ''}
          value={value}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        />
      );
    }

    return (
      <input
        id={`field-${key}`}
        type="text"
        className="form-input"
        placeholder={prop.placeholder || ''}
        value={value}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
      />
    );
  }

  // Loading state: skeleton placeholders
  if (!workflow && !error) {
    return (
      <div className="workflow-detail-skeleton">
        <div className="page-header">
          <div className="skeleton-detail-header">
            <div className="skeleton skeleton-detail-icon"></div>
            <div>
              <div className="skeleton skeleton-detail-title"></div>
              <div className="skeleton skeleton-detail-subtitle"></div>
            </div>
          </div>
          <div className="skeleton skeleton-text"></div>
        </div>
        <div className="card card-narrow workflow-detail-skeleton-card">
          <div className="skeleton skeleton-text mb-24"></div>
          <div className="form-group">
            <div className="skeleton skeleton-form-label"></div>
            <div className="skeleton skeleton-form-input"></div>
          </div>
          <div className="form-group">
            <div className="skeleton skeleton-form-label"></div>
            <div className="skeleton skeleton-form-input"></div>
          </div>
          <div className="form-group">
            <div className="skeleton skeleton-form-label"></div>
            <div className="skeleton skeleton-form-input"></div>
          </div>
          <div className="skeleton skeleton-button"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="error-banner">
        <div className="error-banner-icon">!</div>
        <div className="error-banner-content">
          <div className="error-banner-heading">Failed to Load Workflow</div>
          <div className="error-banner-message">{error}</div>
        </div>
        <button className="btn btn-outline" onClick={fetchWorkflow}>Retry</button>
      </div>
    );
  }

  // Success / submitted state
  if (submitted) {
    return (
      <div className="empty-state">
        <div className="success-checkmark">&#10003;</div>
        <h1 className="empty-state-heading">Proposal Submitted</h1>
        <p className="empty-state-description">Your run request has been submitted for approval.</p>
        <div className="card success-detail-card">
          <div className="success-detail-row">
            <span className="workflow-icon">{workflow.icon}</span>
            <div>
              <div className="success-workflow-name">{workflow.name}</div>
              <span className="badge badge-pending">Pending Approval</span>
            </div>
          </div>
          <p className="success-proposal-id">
            Proposal ID: <code>{submitted.id}</code>
          </p>
          <div className="success-actions">
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
      <div className="page-hero">
        <div className="page-hero-eyebrow">
          <span className="page-hero-eyebrow-dot" />
          {workflow.category}
        </div>
        <div className="workflow-hero-title">
          <span className="workflow-hero-icon">{workflow.icon}</span>
          <h1>{workflow.name}</h1>
        </div>
        <p>{workflow.description}</p>
        <div className="workflow-hero-tags">
          {workflow.tags.map(t => (
            <span key={t} className="workflow-hero-tag">{t}</span>
          ))}
        </div>
      </div>

      <div className="card card-narrow">
        <h2 className="section-title">Configure &amp; Submit Run</h2>

        {errors.length > 0 && (
          <div className="card form-error-banner">
            <ul className="error-banner-list">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {Object.entries(properties).map(([key, prop]) => (
            <div key={key} className="form-group">
              {prop.type !== 'boolean' && (
                <label className="form-label" htmlFor={`field-${key}`}>
                  {prop.label || key}
                  {schema.required?.includes(key) && <span className="required-asterisk"> *</span>}
                </label>
              )}
              {renderField(key, prop)}
              {fieldErrors[key] && (
                <div className="field-error">{fieldErrors[key]}</div>
              )}
              {prop.minLength && (
                <div className="form-hint">Minimum {prop.minLength} characters</div>
              )}
            </div>
          ))}
          <button
            type="submit"
            className="btn btn-primary mt-8"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Run Proposal'}
          </button>
        </form>
      </div>
    </div>
  );
}
