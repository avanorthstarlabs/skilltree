'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';

const CATEGORIES = ['engineering', 'operations', 'web3', 'security', 'data', 'design', 'meta'];
const RUNTIMES = ['claude-code', 'openai-agents', 'langchain', 'autogpt', 'generic'];
const TOOL_OPTIONS = ['read', 'write', 'glob', 'grep', 'bash', 'web-search', 'web-fetch', 'browser', 'mcp'];

export default function ListSkillPage() {
  const { address, isConnected } = useAccount();

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('engineering');
  const [tags, setTags] = useState('');
  const [icon, setIcon] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priceAmount, setPriceAmount] = useState(0);
  const [runtimes, setRuntimes] = useState(['claude-code', 'generic']);
  const [toolsRequired, setToolsRequired] = useState([]);
  const [minContext, setMinContext] = useState(4000);
  const [inputs, setInputs] = useState([{ name: '', type: 'string', required: true, description: '' }]);
  const [outputs, setOutputs] = useState([{ name: '', type: 'string', description: '' }]);
  const [body, setBody] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Auto-generate slug from name
  function handleNameChange(val) {
    setName(val);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(val));
    }
  }

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function toggleRuntime(rt) {
    setRuntimes(prev =>
      prev.includes(rt) ? prev.filter(r => r !== rt) : [...prev, rt]
    );
  }

  function toggleTool(tool) {
    setToolsRequired(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  }

  function addInput() {
    setInputs([...inputs, { name: '', type: 'string', required: false, description: '' }]);
  }

  function removeInput(idx) {
    setInputs(inputs.filter((_, i) => i !== idx));
  }

  function updateInput(idx, field, value) {
    setInputs(inputs.map((inp, i) => i === idx ? { ...inp, [field]: value } : inp));
  }

  function addOutput() {
    setOutputs([...outputs, { name: '', type: 'string', description: '' }]);
  }

  function removeOutput(idx) {
    setOutputs(outputs.filter((_, i) => i !== idx));
  }

  function updateOutput(idx, field, value) {
    setOutputs(outputs.map((out, i) => i === idx ? { ...out, [field]: value } : out));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const meta = {
      name,
      slug,
      version: '1.0.0',
      author: address || '0x0000000000000000000000000000000000000000',
      author_name: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Anonymous',
      description,
      category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      icon: icon || undefined,
      price: isFree
        ? { amount: 0, currency: 'SKILL', chains: [] }
        : { amount: Number(priceAmount), currency: 'SKILL', chains: ['base', 'solana'] },
      compatibility: {
        runtimes,
        min_context: Number(minContext),
        tools_required: toolsRequired,
      },
      inputs: inputs.filter(i => i.name),
      outputs: outputs.filter(o => o.name),
    };

    try {
      const res = await fetch('/api/v1/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meta, body }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.errors?.join(', ') || data.error || 'Failed to list skill');
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Success state
  if (result) {
    return (
      <div className="list-skill-page">
        <div className="list-skill-success">
          <div className="success-icon">&#9989;</div>
          <h1>Skill Listed!</h1>
          <p>
            <strong>{result.skill?.name || name}</strong> is now live on the SkillTree marketplace.
          </p>
          <div className="success-actions">
            <a href={`/skills/${slug}`} className="btn btn-primary">View Listing</a>
            <a href="/" className="btn btn-outline">Back to Catalog</a>
            <button className="btn btn-outline" onClick={() => { setResult(null); setName(''); setSlug(''); setDescription(''); setBody(''); setTags(''); setIcon(''); }}>
              List Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="list-skill-page">
      <div className="list-skill-header">
        <h1>Sell a Skill</h1>
        <p>List a new .skill.md on the SkillTree marketplace. Fill out the metadata below and paste your skill instructions.</p>
      </div>

      <form onSubmit={handleSubmit} className="list-skill-form">
        {/* Section 1: Basic Info */}
        <fieldset className="form-section">
          <legend>Basic Info</legend>

          <div className="form-row">
            <div className="form-group form-group-grow">
              <label htmlFor="skill-name">Skill Name *</label>
              <input
                id="skill-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Code Review Specialist"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="skill-slug">Slug</label>
              <input
                id="skill-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="code-review-specialist"
              />
            </div>
            <div className="form-group form-group-sm">
              <label htmlFor="skill-icon">Icon</label>
              <input
                id="skill-icon"
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="e.g. 🔍"
                maxLength={4}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="skill-description">Description *</label>
            <textarea
              id="skill-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this skill do? Be specific — agents read this to decide whether to install it."
              rows={3}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="skill-category">Category *</label>
              <select
                id="skill-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </select>
            </div>
            <div className="form-group form-group-grow">
              <label htmlFor="skill-tags">Tags</label>
              <input
                id="skill-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="comma-separated, e.g.: security, code-review, automation"
              />
            </div>
          </div>
        </fieldset>

        {/* Section 2: Pricing */}
        <fieldset className="form-section">
          <legend>Pricing</legend>
          <div className="form-row form-row-align">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={isFree}
                onChange={(e) => setIsFree(e.target.checked)}
              />
              <span>Free / Open Source</span>
            </label>
            {!isFree && (
              <div className="form-group">
                <label htmlFor="skill-price">Price (SKILL tokens)</label>
                <input
                  id="skill-price"
                  type="number"
                  min={1}
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                />
                <span className="form-hint">Paid on Base or Solana. You earn 80%.</span>
              </div>
            )}
          </div>
        </fieldset>

        {/* Section 3: Compatibility */}
        <fieldset className="form-section">
          <legend>Compatibility</legend>

          <div className="form-group">
            <label>Supported Runtimes</label>
            <div className="chip-group">
              {RUNTIMES.map(rt => (
                <button
                  key={rt}
                  type="button"
                  className={`chip ${runtimes.includes(rt) ? 'active' : ''}`}
                  onClick={() => toggleRuntime(rt)}
                >
                  {rt}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Required Tools</label>
            <div className="chip-group">
              {TOOL_OPTIONS.map(tool => (
                <button
                  key={tool}
                  type="button"
                  className={`chip ${toolsRequired.includes(tool) ? 'active' : ''}`}
                  onClick={() => toggleTool(tool)}
                >
                  {tool}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group form-group-sm">
            <label htmlFor="min-context">Min Context Window</label>
            <input
              id="min-context"
              type="number"
              min={1000}
              step={1000}
              value={minContext}
              onChange={(e) => setMinContext(e.target.value)}
            />
          </div>
        </fieldset>

        {/* Section 4: Inputs & Outputs */}
        <fieldset className="form-section">
          <legend>Inputs & Outputs</legend>

          <div className="form-group">
            <label>Inputs <span className="form-hint-inline">(what the skill needs from the agent)</span></label>
            {inputs.map((inp, idx) => (
              <div key={idx} className="io-row">
                <input
                  type="text"
                  placeholder="param name"
                  value={inp.name}
                  onChange={(e) => updateInput(idx, 'name', e.target.value)}
                />
                <select value={inp.type} onChange={(e) => updateInput(idx, 'type', e.target.value)}>
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                  <option value="enum">enum</option>
                </select>
                <input
                  type="text"
                  placeholder="description"
                  value={inp.description}
                  onChange={(e) => updateInput(idx, 'description', e.target.value)}
                  className="io-desc"
                />
                <label className="toggle-label toggle-label-sm">
                  <input
                    type="checkbox"
                    checked={inp.required}
                    onChange={(e) => updateInput(idx, 'required', e.target.checked)}
                  />
                  req
                </label>
                {inputs.length > 1 && (
                  <button type="button" className="btn-icon-remove" onClick={() => removeInput(idx)} title="Remove">
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addInput}>+ Add Input</button>
          </div>

          <div className="form-group">
            <label>Outputs <span className="form-hint-inline">(what the skill produces)</span></label>
            {outputs.map((out, idx) => (
              <div key={idx} className="io-row">
                <input
                  type="text"
                  placeholder="output name"
                  value={out.name}
                  onChange={(e) => updateOutput(idx, 'name', e.target.value)}
                />
                <select value={out.type} onChange={(e) => updateOutput(idx, 'type', e.target.value)}>
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="array">array</option>
                  <option value="object">object</option>
                </select>
                <input
                  type="text"
                  placeholder="description"
                  value={out.description}
                  onChange={(e) => updateOutput(idx, 'description', e.target.value)}
                  className="io-desc"
                />
                {outputs.length > 1 && (
                  <button type="button" className="btn-icon-remove" onClick={() => removeOutput(idx)} title="Remove">
                    &times;
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addOutput}>+ Add Output</button>
          </div>
        </fieldset>

        {/* Section 5: Skill Body */}
        <fieldset className="form-section">
          <legend>Skill Instructions</legend>
          <div className="form-group">
            <label htmlFor="skill-body">
              Markdown Body *
              <span className="form-hint-inline">
                — the executable instructions agents will follow
              </span>
            </label>
            <textarea
              id="skill-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"# Your Skill Name\n\nYou are a specialized agent that...\n\n## Step 1: Gather Context\n...\n\n## Step 2: Execute\n...\n\n## Output Format\n..."}
              rows={16}
              className="code-textarea"
              required
            />
          </div>
        </fieldset>

        {/* Submit */}
        {error && (
          <div className="error-banner" role="alert">
            <div className="error-banner-icon">&#9888;</div>
            <div className="error-banner-content">
              <p className="error-banner-message">{error}</p>
            </div>
          </div>
        )}

        <div className="form-submit-row">
          <div className="form-submit-info">
            {isConnected ? (
              <span className="form-wallet-connected">Listing as {address.slice(0, 6)}...{address.slice(-4)}</span>
            ) : (
              <span className="form-wallet-hint">Connect a wallet to attach your address as the creator</span>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={submitting || !name || !description || !body}
          >
            {submitting ? 'Listing...' : isFree ? 'List Skill (Free)' : `List Skill (${priceAmount} SKILL)`}
          </button>
        </div>
      </form>
    </div>
  );
}
