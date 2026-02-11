/**
 * .skill.md parser — reads skill files, extracts YAML frontmatter + markdown body,
 * validates structure, and computes content hash for integrity verification.
 */
import matter from 'gray-matter';
import crypto from 'crypto';

/**
 * Parse a .skill.md file string into structured data.
 * Returns { meta, body, contentHash, raw }
 */
export function parseSkill(fileContent) {
  const { data: meta, content: body } = matter(fileContent);
  const trimmedBody = body.trim();
  const contentHash = crypto.createHash('sha256').update(trimmedBody).digest('hex');

  return {
    meta,
    body: trimmedBody,
    contentHash,
    raw: fileContent,
  };
}

/**
 * Validate that parsed skill metadata has all required fields.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateSkillMeta(meta) {
  const errors = [];
  const required = ['name', 'version', 'slug', 'description', 'category'];

  for (const field of required) {
    if (!meta[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (meta.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) {
    errors.push('slug must be lowercase alphanumeric with hyphens (e.g., "code-review-specialist")');
  }

  if (meta.version && !/^\d+\.\d+\.\d+$/.test(meta.version)) {
    errors.push('version must follow semver (e.g., "1.0.0")');
  }

  if (meta.price) {
    if (typeof meta.price.amount !== 'number' || meta.price.amount < 0) {
      errors.push('price.amount must be a non-negative number (0 for free)');
    }
    if (!meta.price.currency) {
      errors.push('price.currency is required');
    }
    // Paid skills must specify valid payment chains
    if (meta.price.amount > 0) {
      const validChains = ['base', 'solana'];
      if (!Array.isArray(meta.price.chains) || meta.price.chains.length === 0) {
        errors.push('price.chains must be a non-empty array for paid skills');
      } else {
        const invalid = meta.price.chains.filter(c => !validChains.includes(c));
        if (invalid.length > 0) {
          errors.push(`Invalid chains: ${invalid.join(', ')}. Supported: ${validChains.join(', ')}`);
        }
      }
    }
  }

  if (meta.tags && !Array.isArray(meta.tags)) {
    errors.push('tags must be an array');
  }

  if (meta.inputs && !Array.isArray(meta.inputs)) {
    errors.push('inputs must be an array');
  }

  if (meta.outputs && !Array.isArray(meta.outputs)) {
    errors.push('outputs must be an array');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extract the preview-safe metadata from a skill (no body content).
 * This is what agents see before purchasing.
 */
export function extractPreview(parsed) {
  return {
    name: parsed.meta.name,
    slug: parsed.meta.slug,
    version: parsed.meta.version,
    author: parsed.meta.author || null,
    author_name: parsed.meta.author_name || null,
    description: parsed.meta.description,
    category: parsed.meta.category,
    tags: parsed.meta.tags || [],
    icon: parsed.meta.icon || null,
    price: parsed.meta.price || { amount: 0, currency: 'SKILL', chains: ['base'] },
    compatibility: parsed.meta.compatibility || {},
    stats: parsed.meta.stats || { installs: 0, rating: 0, reviews: 0, verified: false },
    inputs: parsed.meta.inputs || [],
    outputs: parsed.meta.outputs || [],
    contentHash: parsed.contentHash,
    isFree: !parsed.meta.price || parsed.meta.price.amount === 0,
  };
}

/**
 * Serialize a skill back to .skill.md format.
 * Takes meta object + body string, returns full file content.
 */
export function serializeSkill(meta, body) {
  return matter.stringify(body, meta);
}

/**
 * Verify a downloaded skill's integrity against its expected hash.
 */
export function verifyIntegrity(body, expectedHash) {
  const actual = crypto.createHash('sha256').update(body.trim()).digest('hex');
  return actual === expectedHash;
}
