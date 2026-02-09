import { createDirectus, rest, authentication } from '@directus/sdk';
import { DirectusSchema } from '../types';

const CRM_URL = process.env.DIRECTUS_CRM_URL || 'https://crm.megalive.ir';
const AUTH_STORAGE_KEY = 'megalive_auth_session';

// Custom storage adapter to persist tokens in localStorage
// allowing authentication to survive page refreshes.
// The authentication plugin expects an object with get/set methods that handle
// the entire AuthenticationData object, rather than a key-value store interface.
const localStorageAdapter = {
  get: () => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      try {
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  },
  set: (value: any) => {
    if (typeof window !== 'undefined') {
      if (value) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  },
};

// Initialize the SDK Client
// 'autoRefresh: true' ensures the SDK handles token refreshing automatically using the stored refresh token.
export const directus = createDirectus<DirectusSchema>(CRM_URL)
  .with(rest())
  // The authentication plugin is configured with a storage adapter and auto-refresh enabled.
  // This setup persists the session and handles token refreshes automatically.
  // FIX: Added 'json' mode to the authentication method call. This is required for token-based authentication with a storage adapter and resolves a TypeScript type error.
  .with(authentication('json', { 
    storage: localStorageAdapter,
    autoRefresh: true 
  }));

// Helper to generate full asset URL
export const getAssetUrl = (id: string): string => {
  if (!id) return '';
  if (id.startsWith('http')) return id; // Already a full URL
  return `${CRM_URL}/assets/${id}`;
};
