// Light/dark appearance preference. Client-only display setting — no backend
// column, no cross-device sync. Same shape and storage key as accommo-mobile's
// utils/theme.ts; this one stamps `data-theme` because that is what the dark
// block in css/tokens.css keys on.

import { Dark } from 'quasar';

const STORAGE_KEY = 'accommo:theme';

export type ThemeMode = 'light' | 'dark';

export function getStoredTheme(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable (private mode, blocked site data) — fall through.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', mode);
  // Keeps Quasar's own chrome (q-menu, q-dialog, q-skeleton…) in step — those
  // follow the Dark plugin, not our --c-* tokens.
  Dark.set(mode === 'dark');
}

export function setStoredTheme(mode: ThemeMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Non-fatal — theme just won't persist across reloads.
  }
  applyTheme(mode);
}
