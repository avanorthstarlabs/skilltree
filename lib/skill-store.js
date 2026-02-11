/**
 * Skill marketplace store — manages skill listings, purchases, and personal libraries.
 * File-backed JSON for v1, designed to be swapped for a database later.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import { parseSkill, extractPreview, validateSkillMeta } from './skill-parser.js';

const DATA_DIR = join(process.cwd(), 'data');
const SKILLS_DIR = join(process.cwd(), 'skills');

function readJSON(filename) {
  try {
    const raw = readFileSync(join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeJSON(filename, data) {
  if (!existsSync(DATA_DIR)) {
    const { mkdirSync } = require('fs');
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2) + '\n');
}

// --- Skill Listings ---

/**
 * Load all .skill.md files from /skills directory and return parsed previews.
 */
export function getAllSkills() {
  if (!existsSync(SKILLS_DIR)) return [];

  const files = readdirSync(SKILLS_DIR).filter(f => f.endsWith('.skill.md'));
  return files.map(file => {
    const raw = readFileSync(join(SKILLS_DIR, file), 'utf-8');
    const parsed = parseSkill(raw);
    return {
      ...extractPreview(parsed),
      filename: file,
    };
  });
}

/**
 * Search/filter skills by query, category, tag, price range, and free-only flag.
 */
export function searchSkills({ q, category, tag, maxPrice, chain, freeOnly } = {}) {
  let skills = getAllSkills();

  if (q) {
    const query = q.toLowerCase();
    skills = skills.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      s.tags.some(t => t.toLowerCase().includes(query))
    );
  }

  if (category) {
    skills = skills.filter(s => s.category.toLowerCase() === category.toLowerCase());
  }

  if (tag) {
    skills = skills.filter(s => s.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
  }

  if (maxPrice !== undefined && maxPrice !== null) {
    skills = skills.filter(s => s.price.amount <= maxPrice);
  }

  if (chain) {
    skills = skills.filter(s => s.price.chains && s.price.chains.includes(chain.toLowerCase()));
  }

  if (freeOnly) {
    skills = skills.filter(s => s.isFree);
  }

  return skills;
}

/**
 * Get a single skill by slug. Returns full parsed skill (meta + body + hash).
 */
export function getSkillBySlug(slug) {
  // Validate slug format to prevent path traversal
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return null;
  }

  if (!existsSync(SKILLS_DIR)) return null;

  const files = readdirSync(SKILLS_DIR).filter(f => f.endsWith('.skill.md'));
  for (const file of files) {
    const raw = readFileSync(join(SKILLS_DIR, file), 'utf-8');
    const parsed = parseSkill(raw);
    if (parsed.meta.slug === slug) {
      return { ...parsed, filename: file };
    }
  }
  return null;
}

/**
 * Get preview-only data for a skill (no body — this is what unpurchased agents see).
 */
export function getSkillPreview(slug) {
  const skill = getSkillBySlug(slug);
  if (!skill) return null;
  return extractPreview(skill);
}

/**
 * List a new skill on the marketplace. Writes .skill.md file to /skills directory.
 * Returns { success, skill?, errors? }
 */
export function listSkill(meta, body) {
  const validation = validateSkillMeta(meta);
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }

  // Check for duplicate slug
  const existing = getSkillBySlug(meta.slug);
  if (existing) {
    return { success: false, errors: [`Skill with slug "${meta.slug}" already exists`] };
  }

  // Write the .skill.md file
  const { serializeSkill } = require('./skill-parser.js');
  const fileContent = serializeSkill(meta, body);
  const filename = `${meta.slug}.skill.md`;
  writeFileSync(join(SKILLS_DIR, filename), fileContent);

  const parsed = parseSkill(fileContent);
  return { success: true, skill: extractPreview(parsed) };
}

// --- Purchases ---

/**
 * Record a purchase. Returns the purchase record.
 * Rejects duplicate transaction hashes to prevent replay attacks.
 */
export function createPurchase({ buyerAddress, skillSlug, txHash, chain, amount, currency, verificationStatus, verificationDetails }) {
  const purchases = readJSON('purchases.json');

  // Prevent duplicate transaction replay
  if (purchases.some(p => p.tx_hash === txHash)) {
    throw new Error(`Transaction ${txHash} has already been used for a purchase`);
  }

  const purchase = {
    id: `pur-${crypto.randomUUID()}`,
    buyer_address: buyerAddress,
    skill_slug: skillSlug,
    tx_hash: txHash,
    chain,
    amount,
    currency,
    verification_status: verificationStatus || 'unknown',
    verification_details: verificationDetails || null,
    status: 'confirmed',
    purchased_at: new Date().toISOString(),
  };

  purchases.push(purchase);
  writeJSON('purchases.json', purchases);
  return purchase;
}

/**
 * Check if a wallet address has purchased a specific skill.
 */
export function hasPurchased(buyerAddress, skillSlug) {
  const purchases = readJSON('purchases.json');
  return purchases.some(p =>
    p.buyer_address === buyerAddress &&
    p.skill_slug === skillSlug &&
    p.status === 'confirmed'
  );
}

/**
 * Get all purchases for a wallet address (their personal library).
 */
export function getLibrary(buyerAddress) {
  const purchases = readJSON('purchases.json');
  const userPurchases = purchases.filter(p =>
    p.buyer_address === buyerAddress && p.status === 'confirmed'
  );

  // Enrich with skill previews
  return userPurchases.map(p => {
    const preview = getSkillPreview(p.skill_slug);
    return {
      ...p,
      skill: preview,
    };
  }).filter(p => p.skill !== null);
}

/**
 * Get purchase history for a skill (for creator analytics).
 */
export function getSkillPurchases(skillSlug) {
  const purchases = readJSON('purchases.json');
  return purchases.filter(p => p.skill_slug === skillSlug && p.status === 'confirmed');
}

// --- Marketplace Stats ---

/**
 * Get aggregate marketplace stats.
 */
export function getMarketplaceStats() {
  const skills = getAllSkills();
  const purchases = readJSON('purchases.json').filter(p => p.status === 'confirmed');

  const totalVolume = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
  const freeSkills = skills.filter(s => s.isFree).length;
  const paidSkills = skills.filter(s => !s.isFree).length;

  return {
    total_skills: skills.length,
    free_skills: freeSkills,
    paid_skills: paidSkills,
    total_purchases: purchases.length,
    total_volume: totalVolume,
    unique_buyers: [...new Set(purchases.map(p => p.buyer_address))].length,
  };
}
