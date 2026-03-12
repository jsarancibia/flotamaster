'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle({ variant = 'full' }: { variant?: 'full' | 'icon' }) {
  const { theme, toggleTheme } = useTheme()

  if (variant === 'icon') {
    const isLight = theme === 'light'
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isLight ? 'Activar modo oscuro' : 'Activar modo claro'}
        className="inline-flex items-center justify-center p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
      >
        {isLight ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-5 h-5" />
          <span className="font-medium">Modo Oscuro</span>
        </>
      ) : (
        <>
          <Sun className="w-5 h-5" />
          <span className="font-medium">Modo Claro</span>
        </>
      )}
    </button>
  )
}
