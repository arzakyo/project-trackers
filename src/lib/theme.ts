export type ThemeMode = 'dark' | 'light' | 'system';

export const THEME_KEY = 'dominus4d_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved && (saved === 'dark' || saved === 'light' || saved === 'system')) {
      return saved;
    }
  } catch {}
  return 'dark';
}

export function applyTheme(theme: ThemeMode): void {
  if (typeof window === 'undefined') return;

  let effective: 'dark' | 'light' = theme === 'system' ? 'dark' : theme;
  if (theme === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    effective = 'light';
  }

  document.body.setAttribute('data-theme', effective);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}

  window.dispatchEvent(new CustomEvent('dominus4d_theme_change', { detail: theme }));
}

export function initGlobalTheme(): ThemeMode {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
