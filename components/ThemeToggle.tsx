'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
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
