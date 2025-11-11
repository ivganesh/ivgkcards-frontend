import type { AuthUser } from '@/types/auth';

const ACCESS_TOKEN_KEY = 'ivgk_access_token';
const REFRESH_TOKEN_KEY = 'ivgk_refresh_token';
const USER_KEY = 'ivgk_user';

export const authStorage = {
  save(tokens: { accessToken: string; refreshToken: string }, user?: AuthUser) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    if (user) {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },
  clear() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
  getAccessToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  getRefreshToken() {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  getUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthUser;
    } catch (error) {
      console.warn('Failed to parse stored user, clearing session.', error);
      window.localStorage.removeItem(USER_KEY);
      return null;
    }
  },
};
