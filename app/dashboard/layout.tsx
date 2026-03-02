import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { 
  Car, 
  Users, 
  Wrench, 
  TrendingUp, 
  LogOut,
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Resumen' },
    { href: '/dashboard/vehicles', icon: Car, label: 'Vehículos' },
    { href: '/dashboard/drivers', icon: Users, label: 'Choferes' },
    { href: '/dashboard/maintenances', icon: Wrench, label: 'Mantenimientos' },
    { href: '/dashboard/finances', icon: TrendingUp, label: 'Finanzas' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-primary dark:text-white">FlotaMaster</span>
          </Link>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-700">
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
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
