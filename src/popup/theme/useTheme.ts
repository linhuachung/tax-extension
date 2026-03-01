export type Theme = 'light' | 'dark'

const themeStorageKey = 'vii.theme'

const getPreferredTheme = (): Theme => {
  const stored = localStorage.getItem(themeStorageKey)
  if (stored === 'dark' || stored === 'light') return stored
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement
  root.dataset.theme = theme
}

export const setThemePersisted = (theme: Theme): void => {
  localStorage.setItem(themeStorageKey, theme)
  applyTheme(theme)
}

export const initTheme = (): Theme => {
  const theme = getPreferredTheme()
  applyTheme(theme)
  return theme
}
