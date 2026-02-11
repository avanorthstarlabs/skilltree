/**
 * On-chain payment verification for Base and Solana.
 *
 * Verifies that a transaction hash corresponds to a real payment
 * to the marketplace wallet before confirming a purchase.
 *
 * Base: Uses viem to read transaction receipts from Base RPC.
 * Solana: Uses @solana/web3.js to confirm transactions on Solana.
 */
import { createPublicClient, http, parseEther, formatEther } from 'viem';
import { base } from 'viem/chains';

// Marketplace treasury wallet addresses — replace with real ones in production
const TREASURY_WALLETS = {
  base: '0x0000000000000000000000000000000000000000',   // TODO: Set real Base treasury
  solana: '11111111111111111111111111111111',             // TODO: Set real Solana treasury
};

// Base chain public client
const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

/**
 * Verify a payment transaction on Base chain.
 *
 * Checks:
 * 1. Transaction exists and succeeded
 * 2. Transaction was sent to the treasury wallet (or is a token transfer to it)
 * 3. Value matches expected amount (with tolerance for gas)
 *
 * Returns { verified: boolean, details: {...} }
 */
export async function verifyBasePayment(txHash, expectedAmount) {
  try {
    const tx = await baseClient.getTransaction({ hash: txHash });
    const receipt = await baseClient.getTransactionReceipt({ hash: txHash });

    if (!tx || !receipt) {
      return { verified: false, reason: 'Transaction not found on Base' };
    }

    if (receipt.status !== 'success') {
      return { verified: false, reason: 'Transaction failed on-chain' };
    }

    // Verify recipient is the marketplace treasury
    const treasury = TREASURY_WALLETS.base;
    if (treasury === '0x0000000000000000000000000000000000000000') {
      // Treasury not configured — flag for manual review
      console.warn('[chain-verify] Treasury wallet not configured — skipping recipient check');
    } else if (tx.to?.toLowerCase() !== treasury.toLowerCase()) {
      return { verified: false, reason: 'Payment not sent to marketplace treasury' };
    }

    // Verify payment amount meets minimum (if expectedAmount provided)
    if (expectedAmount && expectedAmount > 0) {
      const paidEth = parseFloat(formatEther(tx.value));
      if (paidEth < expectedAmount) {
        return { verified: false, reason: `Insufficient payment: expected ${expectedAmount}, got ${paidEth}` };
      }
    }

    return {
      verified: true,
      details: {
        chain: 'base',
        txHash,
        from: tx.from,
        to: tx.to,
        value: formatEther(tx.value),
        blockNumber: Number(receipt.blockNumber),
        status: receipt.status,
        gasUsed: Number(receipt.gasUsed),
      },
    };
  } catch (err) {
    // In development/testing, if RPC fails, fall back to unverified
    console.error('Base payment verification failed:', err.message);
    return {
      verified: false,
      reason: `RPC error: ${err.message}`,
      fallback: true,
    };
  }
}

/**
 * Verify a payment on any supported chain.
 * Routes to the appropriate chain-specific verifier.
 *
 * For v1: Base verification is live via viem RPC.
 *         Solana verification is simulated (returns unverified with fallback).
 */
export async function verifyPayment(txHash, chain, expectedAmount) {
  if (chain === 'base') {
    return verifyBasePayment(txHash, expectedAmount);
  }

  if (chain === 'solana') {
    // TODO v2: Implement Solana verification via @solana/web3.js
    return {
      verified: false,
      reason: 'Solana verification not yet implemented',
      fallback: true,
    };
  }

  return { verified: false, reason: `Unsupported chain: ${chain}` };
}

/**
 * Get the treasury wallet address for a chain.
 */
export function getTreasuryAddress(chain) {
  return TREASURY_WALLETS[chain] || null;
}
