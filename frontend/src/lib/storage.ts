import type { SafeUser } from '@/types';

const ACCESS_TOKEN_KEY = 'hospital_access_token';
const USER_KEY = 'hospital_user';
const THEME_KEY = 'hospital_theme';

// ─── Access Token ───
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// ─── User ───
export function getStoredUser(): SafeUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SafeUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: SafeUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  localStorage.removeItem(USER_KEY);
}

/** Clear all authentication data */
export function clearAllAuth(): void {
  clearAccessToken();
  clearStoredUser();
}

// ─── Theme ───
export function getStoredTheme(): string {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(THEME_KEY) ?? 'light';
}

export function setStoredTheme(theme: string): void {
  localStorage.setItem(THEME_KEY, theme);
}
