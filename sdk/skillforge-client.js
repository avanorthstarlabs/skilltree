/**
 * SkillForge Agent SDK
 *
 * Lightweight client library for agents to interact with the SkillForge marketplace.
 * Supports discovery, evaluation, purchase, download, and library management.
 *
 * Usage:
 *   import { SkillForge } from './skillforge-client.js';
 *   const sf = new SkillForge('https://skillforge.example.com');
 *   const skills = await sf.search({ q: 'code review', category: 'engineering' });
 *   const preview = await sf.preview('code-review-specialist');
 *   const purchase = await sf.purchase('code-review-specialist', { buyer_address: '0x...', tx_hash: '0x...', chain: 'base' });
 *   const skill = await sf.download('code-review-specialist', '0x...');
 */

export class SkillForge {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiBase = `${this.baseUrl}/api/v1`;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': options.userAgent || 'SkillForge-Agent-SDK/1.0',
      ...options.headers,
    };
  }

  async _fetch(path, options = {}) {
    const url = `${this.apiBase}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: { ...this.defaultHeaders, ...options.headers },
    });
    const data = await res.json();
    if (!res.ok) {
      const error = new Error(data.error || data.errors?.[0] || `HTTP ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  // --- Discovery ---

  /**
   * Search the skill catalog.
   * @param {Object} filters - { q, category, tag, max_price, chain, free }
   * @returns {Promise<{ skills: Array, count: number }>}
   */
  async search(filters = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.tag) params.set('tag', filters.tag);
    if (filters.max_price !== undefined) params.set('max_price', String(filters.max_price));
    if (filters.chain) params.set('chain', filters.chain);
    if (filters.free) params.set('free', 'true');
    const qs = params.toString();
    return this._fetch(`/skills${qs ? `?${qs}` : ''}`);
  }

  /**
   * Get full skill details. Free skills include body; paid skills return preview only.
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  async get(slug) {
    return this._fetch(`/skills/${slug}`);
  }

  /**
   * Get preview-only metadata for a skill (never includes body).
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  async preview(slug) {
    return this._fetch(`/skills/${slug}/preview`);
  }

  // --- Purchase ---

  /**
   * Purchase a paid skill.
   * @param {string} slug
   * @param {Object} payment - { buyer_address, tx_hash, chain }
   * @returns {Promise<{ success: boolean, purchase: Object, download_url: string }>}
   */
  async purchase(slug, { buyer_address, tx_hash, chain }) {
    return this._fetch(`/skills/${slug}/purchase`, {
      method: 'POST',
      body: JSON.stringify({ buyer_address, tx_hash, chain }),
    });
  }

  // --- Download ---

  /**
   * Download a skill's full .skill.md content.
   * Free skills don't need buyer. Paid skills require buyer address with confirmed purchase.
   * @param {string} slug
   * @param {string} [buyerAddress] - Required for paid skills
   * @returns {Promise<{ skill_content: string, content_hash: string, filename: string }>}
   */
  async download(slug, buyerAddress) {
    const params = buyerAddress ? `?buyer=${encodeURIComponent(buyerAddress)}` : '';
    return this._fetch(`/skills/${slug}/download${params}`);
  }

  // --- Library ---

  /**
   * Get an agent's personal skill library (all purchased skills).
   * @param {string} address - Wallet address
   * @returns {Promise<{ address: string, skills: Array, count: number }>}
   */
  async library(address) {
    return this._fetch(`/library?address=${encodeURIComponent(address)}`);
  }

  // --- Marketplace Info ---

  /**
   * Get public marketplace statistics.
   * @returns {Promise<Object>}
   */
  async stats() {
    return this._fetch('/stats');
  }

  // --- Listing ---

  /**
   * List a new skill on the marketplace.
   * @param {Object} meta - Skill metadata (name, slug, version, description, etc.)
   * @param {string} body - Markdown skill instructions
   * @returns {Promise<{ success: boolean, skill: Object }>}
   */
  async listSkill(meta, body) {
    return this._fetch('/skills', {
      method: 'POST',
      body: JSON.stringify({ meta, body }),
    });
  }

  // --- Convenience Methods ---

  /**
   * Discover, evaluate, and decide whether to purchase a skill.
   * Returns full info for free skills, preview + purchase info for paid.
   * @param {string} slug
   * @returns {Promise<Object>}
   */
  async evaluate(slug) {
    const skill = await this.get(slug);
    return {
      ...skill,
      recommendation: skill.isFree
        ? 'FREE — download immediately with no payment required'
        : `PAID — costs ${skill.price.amount} ${skill.price.currency} on ${skill.price.chains.join(' or ')}`,
      next_action: skill.isFree
        ? { method: 'download', endpoint: `/api/v1/skills/${slug}/download` }
        : { method: 'purchase', endpoint: `/api/v1/skills/${slug}/purchase`, requires: ['buyer_address', 'tx_hash', 'chain'] },
    };
  }

  /**
   * Full acquisition flow: evaluate → purchase (if needed) → download → verify.
   * For free skills: skips purchase step.
   * For paid skills: requires payment params.
   *
   * @param {string} slug
   * @param {Object} [payment] - { buyer_address, tx_hash, chain } — required for paid skills
   * @returns {Promise<{ skill_content: string, content_hash: string, verified: boolean }>}
   */
  async acquire(slug, payment) {
    const info = await this.evaluate(slug);

    if (!info.isFree && !payment) {
      throw new Error(`Skill "${slug}" costs ${info.price.amount} ${info.price.currency}. Provide payment params to acquire.`);
    }

    // Purchase if paid
    if (!info.isFree) {
      await this.purchase(slug, payment);
    }

    // Download
    const result = await this.download(slug, payment?.buyer_address);

    // Verify integrity — strict SHA-256 equality check
    const crypto = await import('crypto');
    const actualHash = crypto.createHash('sha256').update(result.skill_content.trim()).digest('hex');
    const verified = result.content_hash ? actualHash === result.content_hash : false;

    return {
      ...result,
      verified,
      slug,
      acquisition: info.isFree ? 'free' : 'purchased',
    };
  }
}

export default SkillForge;
