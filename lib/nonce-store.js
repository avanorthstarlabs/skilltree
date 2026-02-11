/**
 * In-memory nonce store with TTL for wallet sign-in challenge-response.
 * Nonces are single-use and expire after 5 minutes.
 */
import crypto from 'crypto';

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const nonces = new Map();

/** Generate a fresh nonce and store it with a TTL. */
export function generateNonce() {
  const nonce = crypto.randomBytes(32).toString('hex');
  nonces.set(nonce, Date.now() + NONCE_TTL_MS);
  return nonce;
}

/** Validate and consume a nonce (one-time use). Returns true if valid. */
export function validateNonce(nonce) {
  const expiry = nonces.get(nonce);
  if (!expiry) return false;

  // Always delete — single use
  nonces.delete(nonce);

  if (Date.now() > expiry) return false;
  return true;
}

/** Periodic cleanup of expired nonces to prevent memory leaks. */
function cleanup() {
  const now = Date.now();
  for (const [nonce, expiry] of nonces) {
    if (now > expiry) nonces.delete(nonce);
  }
}

// Run cleanup every 10 minutes
setInterval(cleanup, 10 * 60 * 1000).unref();
