/**
 * User store — manages user profiles and linked auth methods.
 * File-backed JSON storage following the same pattern as store.js and skill-store.js.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = 'users.json';

function readUsers() {
  try {
    const raw = readFileSync(join(DATA_DIR, USERS_FILE), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function writeUsers(users) {
  if (!existsSync(DATA_DIR)) {
    const { mkdirSync } = require('fs');
    mkdirSync(DATA_DIR, { recursive: true });
  }
  writeFileSync(join(DATA_DIR, USERS_FILE), JSON.stringify(users, null, 2) + '\n');
}

export function getUserById(id) {
  const users = readUsers();
  return users.find(u => u.id === id) || null;
}

export function findUserByGoogleSub(sub) {
  const users = readUsers();
  return users.find(u => u.auth_methods?.google?.sub === sub) || null;
}

export function findUserByWalletAddress(address, providerKey) {
  const users = readUsers();
  const addr = address.toLowerCase();
  return users.find(u => {
    const method = u.auth_methods?.[providerKey];
    if (!method) return false;
    return method.address?.toLowerCase() === addr;
  }) || null;
}

export function createUser({ display_name, email, avatar_url, auth_methods }) {
  const users = readUsers();
  const user = {
    id: `usr-${crypto.randomUUID()}`,
    display_name: display_name || 'Anonymous',
    avatar_url: avatar_url || null,
    email: email || null,
    auth_methods: auth_methods || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  return user;
}

export function updateUser(id, updates) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates, updated_at: new Date().toISOString() };
  writeUsers(users);
  return users[idx];
}

export function linkAuthMethod(userId, providerKey, data) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;

  users[idx].auth_methods = {
    ...users[idx].auth_methods,
    [providerKey]: { ...data, linked_at: new Date().toISOString() },
  };
  users[idx].updated_at = new Date().toISOString();
  writeUsers(users);
  return users[idx];
}

export function unlinkAuthMethod(userId, providerKey) {
  const users = readUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return null;

  const methods = { ...users[idx].auth_methods };
  delete methods[providerKey];

  if (Object.keys(methods).length === 0) {
    throw new Error('Cannot unlink last auth method');
  }

  users[idx].auth_methods = methods;
  users[idx].updated_at = new Date().toISOString();
  writeUsers(users);
  return users[idx];
}

export function getAllAddressesForUser(userId) {
  const user = getUserById(userId);
  if (!user) return [];

  const addresses = [];
  const methods = user.auth_methods || {};

  if (methods.evm?.address) {
    addresses.push(methods.evm.address);
  }
  if (methods.solana?.address) {
    addresses.push(methods.solana.address);
  }

  return addresses;
}
