import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import DashboardShell from '@/components/DashboardShell'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type NavIconName = 'LayoutDashboard' | 'Car' | 'Users' | 'Wrench' | 'TrendingUp' | 'Settings' | 'Package'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  const navItems: Array<{ href: string; iconName: NavIconName; label: string }> = [
    { href: '/dashboard', iconName: 'LayoutDashboard', label: 'Panel' },
    { href: '/dashboard/vehicles', iconName: 'Car', label: 'Vehículos' },
    { href: '/dashboard/drivers', iconName: 'Users', label: 'Conductores' },
    { href: '/dashboard/maintenances', iconName: 'Wrench', label: 'Mantenimientos' },
    { href: '/dashboard/finances', iconName: 'TrendingUp', label: 'Pagos Semanales' },
    { href: '/dashboard/control-financiero', iconName: 'Wrench', label: 'Control Financiero' },
    { href: '/dashboard/repuestos', iconName: 'Package', label: 'Repuestos' },
  ]

  return (
    <DashboardShell navItems={navItems}>
      {children}
    </DashboardShell>
  )
}
