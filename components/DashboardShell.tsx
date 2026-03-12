'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, LayoutDashboard, LogOut, Menu, Package, Settings, TrendingUp, Users, Wrench, X } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { BrandLogo } from '@/components/BrandLogo'

type NavItem = {
  href: string
  label: string
  iconName: keyof typeof ICONS
}

const ICONS = {
  LayoutDashboard,
  Car,
  Users,
  Wrench,
  TrendingUp,
  Settings,
  Package,
} as const

export default function DashboardShell({
  children,
  navItems,
}: {
  children: React.ReactNode
  navItems: NavItem[]
}) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const SidebarContent = (
    <>
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <Link
          href="/"
          className="flex items-center gap-3"
          onClick={() => setMobileOpen(false)}
        >
          <BrandLogo size={40} className="shrink-0" priority />
          <span className="font-heading font-bold text-lg text-primary dark:text-white">BlasRodríguez</span>
        </Link>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href
          const cls = active
            ? 'bg-gray-50 dark:bg-gray-700 text-primary dark:text-white'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white'

          const Icon = ICONS[item.iconName]

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${cls}`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-700">
        <ThemeToggle />
        <form action="/api/auth/logout" method="POST" className="mt-2">
          <button
            type="submit"
            className="flex items-center gap-3 px-4 py-3 w-full text-gray-600 dark:text-gray-300 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="md:hidden sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>

          <Link href="/" className="flex items-center gap-2">
            <BrandLogo size={32} className="shrink-0" priority />
            <span className="font-heading font-bold text-primary dark:text-white">BlasRodríguez</span>
          </Link>

          <div className="w-10" />
        </div>
      </header>

      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40 flex-col">
        {SidebarContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 flex items-center justify-end border-b border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
            {SidebarContent}
          </div>
        </div>
      )}

      <main className="md:ml-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
