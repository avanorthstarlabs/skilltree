import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { findUserByGoogleSub, findUserByWalletAddress, createUser, getUserById } from './lib/user-store.js';
import { verifyWalletSignature } from './lib/wallet-verify.js';
import { validateNonce } from './lib/nonce-store.js';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google,
    Credentials({
      id: 'wallet',
      name: 'Wallet',
      credentials: {
        address: { type: 'text' },
        signature: { type: 'text' },
        message: { type: 'text' },
        nonce: { type: 'text' },
        chain: { type: 'text' },
      },
      async authorize(credentials) {
        const { address, signature, message, nonce, chain } = credentials;

        if (!address || !signature || !message || !nonce || !chain) {
          return null;
        }

        // Validate nonce (single-use, 5-min TTL)
        if (!validateNonce(nonce)) {
          return null;
        }

        // Verify wallet signature
        const valid = await verifyWalletSignature({ address, signature, message, chain });
        if (!valid) {
          return null;
        }

        // Map chain to provider key
        const providerKey = chain === 'solana' ? 'solana' : 'evm';

        // Find existing user or create new one
        let user = findUserByWalletAddress(address, providerKey);
        if (!user) {
          const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`;
          user = createUser({
            display_name: truncated,
            auth_methods: {
              [providerKey]: {
                address,
                chain: chain === 'solana' ? 'solana' : 'base',
              },
            },
          });
        }

        return {
          id: user.id,
          name: user.display_name,
          image: user.avatar_url,
        };
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Google sign-in: find or create user, attach our user ID
      if (account?.provider === 'google') {
        let dbUser = findUserByGoogleSub(profile.sub);
        if (!dbUser) {
          dbUser = createUser({
            display_name: profile.name,
            email: profile.email,
            avatar_url: profile.picture,
            auth_methods: {
              google: {
                sub: profile.sub,
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
              },
            },
          });
        }
        // Attach our user ID to the user object so jwt callback can read it
        user.id = dbUser.id;
        user.name = dbUser.display_name;
        user.image = dbUser.avatar_url;
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // On initial sign-in, persist custom fields from user object
      if (user) {
        token.userId = user.id;
        const dbUser = getUserById(user.id);
        if (dbUser) {
          token.displayName = dbUser.display_name;
          token.avatarUrl = dbUser.avatar_url;
          token.authMethods = Object.keys(dbUser.auth_methods || {});
        }
      }

      // Handle client-side session update (e.g., after profile edit or linking)
      if (trigger === 'update' && session) {
        const dbUser = getUserById(token.userId);
        if (dbUser) {
          token.displayName = dbUser.display_name;
          token.avatarUrl = dbUser.avatar_url;
          token.authMethods = Object.keys(dbUser.auth_methods || {});
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId;
      session.user.displayName = token.displayName;
      session.user.avatarUrl = token.avatarUrl;
      session.user.authMethods = token.authMethods;
      return session;
    },
  },
});
