export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'health-guideline-edge-theme';

export function normalizeTheme(value: string | null | undefined): ThemeMode {
  return value === 'light' ? 'light' : 'dark';
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'dark';
  }
  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') {
    return;
  }
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export function persistTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
