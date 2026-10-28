import { useCallback, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'rrhh-theme';

export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* almacenamiento no disponible */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

/** Tema claro/oscuro con persistencia local; el atributo data-theme lo consume styles.css. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) || getInitialTheme());
  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem(KEY, next); } catch { /* ignorar */ }
    setTheme(next);
  }, [theme]);
  return { theme, toggle };
}
