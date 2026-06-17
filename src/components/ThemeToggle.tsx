import { Moon, Sun } from 'lucide-react'
import { useState } from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'workout-planner.theme'

function initialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      document.documentElement.dataset.theme = stored
      return stored
    }
  } catch {
    // Il tema resta utilizzabile anche se lo storage del browser è bloccato.
  }

  const preferred: Theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.dataset.theme = preferred
  return preferred
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Alcuni browser possono bloccare lo storage in modalità privata.
  }

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (themeColor) themeColor.content = theme === 'dark' ? '#09070d' : '#7c3aed'
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const value = initialTheme()
    applyTheme(value)
    return value
  })

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  const dark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-logo-button"
      onClick={toggleTheme}
      aria-label={dark ? 'Attiva modalità chiara' : 'Attiva modalità scura'}
      title={dark ? 'Modalità chiara' : 'Modalità scura'}
    >
      <span className="theme-logo-mark" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" /></span>
      <span className="theme-mode-badge" aria-hidden="true">
        {dark ? <Sun size={10} strokeWidth={2.6} /> : <Moon size={10} strokeWidth={2.6} />}
      </span>
    </button>
  )
}
