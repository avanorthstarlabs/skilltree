/**
 * Wallet signature verification for EVM (Base) and Solana chains.
 * Used to prove wallet ownership during sign-in and account linking.
 */
import { verifyMessage } from 'viem';
import nacl from 'tweetnacl';
import { PublicKey } from '@solana/web3.js';

/**
 * Verify a wallet signature.
 * @param {{ address: string, signature: string, message: string, chain: 'evm'|'solana' }} params
 * @returns {Promise<boolean>}
 */
export async function verifyWalletSignature({ address, signature, message, chain }) {
  try {
    if (chain === 'evm') {
      return await verifyMessage({
        address,
        message,
        signature,
      });
    }

    if (chain === 'solana') {
      const pubkey = new PublicKey(address);
      const messageBytes = new TextEncoder().encode(message);
      // Signature comes as base58 or hex — decode from hex
      const signatureBytes = Buffer.from(signature, 'base64');
      return nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        pubkey.toBytes(),
      );
    }

    return false;
  } catch {
    return false;
  }
}
