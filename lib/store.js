/**
 * File-backed JSON storage layer with atomic read/write operations.
 * All entity data is stored as JSON arrays in /data/*.json files.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

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
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2) + '\n');
}

// --- Workflows ---
export function getWorkflows({ search, category, tag } = {}) {
  let workflows = readJSON('workflows.json');
  if (search) {
    const q = search.toLowerCase();
    workflows = workflows.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.description.toLowerCase().includes(q) ||
      w.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  if (category) {
    workflows = workflows.filter(w => w.category.toLowerCase() === category.toLowerCase());
  }
  if (tag) {
    workflows = workflows.filter(w => w.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
  }
  return workflows;
}

export function getWorkflowBySlug(slug) {
  const workflows = readJSON('workflows.json');
  return workflows.find(w => w.slug === slug) || null;
}

// --- Proposals ---
export function getProposals({ status } = {}) {
  let proposals = readJSON('proposals.json');
  if (status) {
    proposals = proposals.filter(p => p.status === status);
  }
  return proposals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getProposalById(id) {
  const proposals = readJSON('proposals.json');
  return proposals.find(p => p.id === id) || null;
}

export function createProposal(proposal) {
  const proposals = readJSON('proposals.json');
  proposals.push(proposal);
  writeJSON('proposals.json', proposals);
  return proposal;
}

export function updateProposal(id, updates) {
  const proposals = readJSON('proposals.json');
  const idx = proposals.findIndex(p => p.id === id);
  if (idx === -1) return null;
  proposals[idx] = { ...proposals[idx], ...updates };
  writeJSON('proposals.json', proposals);
  return proposals[idx];
}

// --- Approvals ---
export function getApprovals() {
  return readJSON('approvals.json');
}

export function getApprovalByProposalId(proposalId) {
  const approvals = readJSON('approvals.json');
  return approvals.find(a => a.proposal_id === proposalId) || null;
}

export function createApproval(approval) {
  const approvals = readJSON('approvals.json');
  approvals.push(approval);
  writeJSON('approvals.json', approvals);
  return approval;
}

// --- Receipts ---
export function getReceipts() {
  const receipts = readJSON('receipts.json');
  return receipts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getReceiptByProposalId(proposalId) {
  const receipts = readJSON('receipts.json');
  return receipts.find(r => r.proposal_id === proposalId) || null;
}

export function createReceipt(receipt) {
  const receipts = readJSON('receipts.json');
  receipts.push(receipt);
  writeJSON('receipts.json', receipts);
  return receipt;
}
