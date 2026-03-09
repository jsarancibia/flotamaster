'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Users, Wrench, FileText, Fuel, AlertTriangle, AlertCircle } from 'lucide-react'

interface Maintenance {
  id: string
  description: string
  status: string
  vehicle: { plate: string }
}

interface Stats {
  totalVehicles: number
  availableVehicles: number
  rentedVehicles: number
  totalDrivers: number
  pendingMaintenances: number
  recentMaintenances: Maintenance[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchStats = async () => {
    try {
      const [vehiclesRes, driversRes, maintenancesRes] = await Promise.all([
        fetch('/api/vehicles', { credentials: 'include' }),
        fetch('/api/drivers', { credentials: 'include' }),
        fetch('/api/maintenances', { credentials: 'include' })
      ])

      if (vehiclesRes.status === 401 || driversRes.status === 401 || maintenancesRes.status === 401) {
        router.push('/login')
        return
      }

      const [vehicles, drivers, maintenances] = await Promise.all([
        vehiclesRes.json(),
        driversRes.json(),
        maintenancesRes.json()
      ])

      const totalVehicles = vehicles.vehicles?.length || 0
      const availableVehicles = vehicles.vehicles?.filter((v: any) => v.status === 'disponible').length || 0
      const rentedVehicles = vehicles.vehicles?.filter((v: any) => v.status === 'alquilado').length || 0
      const totalDrivers = drivers.drivers?.length || 0
      const pendingMaintenances = maintenances.maintenances?.filter((m: any) => m.status === 'pendiente').length || 0
      const recentMaintenances = maintenances.maintenances?.slice(0, 5) || []

      setStats({
        totalVehicles,
        availableVehicles,
        rentedVehicles,
        totalDrivers,
        pendingMaintenances,
        recentMaintenances
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const cards = stats ? [
    {
      title: 'Vehículos',
      value: stats.totalVehicles,
      icon: Car,
      color: 'bg-blue-500',
      subtitle: `${stats.availableVehicles} disponibles • ${stats.rentedVehicles} en ruta`
    },
    {
      title: 'Conductores',
      value: stats.totalDrivers,
      icon: Users,
      color: 'bg-green-500',
      subtitle: 'Conductores activos'
    },
    {
      title: 'Mantenimientos',
      value: stats.pendingMaintenances,
      icon: Wrench,
      color: 'bg-orange-500',
      subtitle: 'Pendientes',
      alert: stats.pendingMaintenances > 0
    },
    {
      title: 'Documentos',
      value: 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
      subtitle: 'Por vencer'
    },
    {
      title: 'Combustible',
      value: 0,
      icon: Fuel,
      color: 'bg-indigo-500',
      subtitle: 'Registros del mes'
    },
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Panel de Control</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Resumen de tu flota de taxis y colectivos</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {cards.map((card, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              {card.alert && (
                <AlertCircle className="w-4 h-4 text-orange-500" />
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">{card.title}</p>
            <p className="font-heading text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Recent Maintenances */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">Mantenimientos Recientes</h2>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {!stats?.recentMaintenances || stats.recentMaintenances.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No hay mantenimientos registrados
            </div>
          ) : (
            stats.recentMaintenances.map((m) => (
              <div key={m.id} className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    m.status === 'pendiente' ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <Wrench className={`w-5 h-5 ${
                      m.status === 'pendiente' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{m.vehicle.plate}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{m.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm ${
                    m.status === 'pendiente' ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {m.status === 'pendiente' ? 'Pendiente' : 'Completado'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
