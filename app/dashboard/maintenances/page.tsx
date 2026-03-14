'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, Plus, AlertCircle, CheckCircle, Car, X, Package, Trash2 } from 'lucide-react'
import { formatCurrencyCLP, formatDateDDMMYYYY } from '@/lib/format'

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string | null
  type: string
  status: string
}

interface MaintenanceVehicle {
  id: string
  plate: string
  brand: string
  model: string
  year: number
  color: string | null
  status: string
  driver: { name: string } | null
}

interface Maintenance {
  id: string
  type: string
  category: string
  description: string
  cost: number
  date: string
  status: string
  vehicle: { id: string; plate: string }
}

interface Repuesto {
  id: string
  nombre: string
  cantidadActual: number
  cantidadComprada: number
  precioUnitario: number
  vehiculo: { id: string; plate: string } | null
}

interface RepuestoSeleccionado {
  repuestoId: string
  cantidad: number
}

export default function MaintenancesPage() {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([])
  const [maintenanceVehicles, setMaintenanceVehicles] = useState<MaintenanceVehicle[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([])
  const [repuestos, setRepuestos] = useState<Repuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const [repuestosSeleccionados, setRepuestosSeleccionados] = useState<RepuestoSeleccionado[]>([])

  const fetchMaintenances = useCallback(async () => {
    try {
      const res = await fetch('/api/maintenances', { credentials: 'include' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      if (data.maintenances) setMaintenances(data.maintenances)
      if (data.maintenanceVehicles) setMaintenanceVehicles(data.maintenanceVehicles)
    } catch (error) {
      console.error('Error fetching maintenances:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data.vehicles) {
          const available = data.vehicles.filter((v: Vehicle) => v.status === 'disponible')
          setAvailableVehicles(available)
          setVehicles(data.vehicles)
        }
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error)
    }
  }, [])

  const fetchRepuestos = useCallback(async () => {
    try {
      const res = await fetch('/api/repuestos', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setRepuestos((data?.repuestos || []) as Repuesto[])
      }
    } catch {
      setRepuestos([])
    }
  }, [])

  useEffect(() => {
    Promise.all([fetchMaintenances(), fetchVehicles(), fetchRepuestos()])
  }, [fetchMaintenances, fetchVehicles, fetchRepuestos])

  const formatCurrency = (amount: number) => formatCurrencyCLP(amount)

  const pending = maintenances.filter(m => m.status === 'pendiente')
  const completed = maintenances.filter(m => m.status === 'completado')

  const repuestosDisponibles = repuestos.filter(
    r => r.cantidadActual > 0 && !repuestosSeleccionados.some(s => s.repuestoId === r.id)
  )

  const agregarRepuesto = (repuestoId: string) => {
    if (!repuestoId) return
    setRepuestosSeleccionados(prev => [...prev, { repuestoId, cantidad: 1 }])
  }

  const quitarRepuesto = (repuestoId: string) => {
    setRepuestosSeleccionados(prev => prev.filter(s => s.repuestoId !== repuestoId))
  }

  const cambiarCantidad = (repuestoId: string, cantidad: number) => {
    const rep = repuestos.find(r => r.id === repuestoId)
    if (!rep) return
    const clamped = Math.max(1, Math.min(rep.cantidadActual, cantidad))
    setRepuestosSeleccionados(prev =>
      prev.map(s => s.repuestoId === repuestoId ? { ...s, cantidad: clamped } : s)
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const formData = new FormData(e.currentTarget)

    const payload: any = Object.fromEntries(formData)

    if (repuestosSeleccionados.length > 0) {
      payload.repuestosUsados = repuestosSeleccionados.map(s => ({
        id: s.repuestoId,
        cantidad: s.cantidad,
      }))
    }

    try {
      const res = await fetch('/api/maintenances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        setError(data.error || 'Error al crear mantenimiento')
        setSubmitting(false)
        return
      }

      setSuccess('Mantenimiento registrado exitosamente')
      setShowModal(false)
      setRepuestosSeleccionados([])
      fetchMaintenances()
      fetchVehicles()
      fetchRepuestos()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error creating maintenance:', error)
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (id: string) => {
    try {
      await fetch(`/api/maintenances/${id}/complete`, { method: 'POST', credentials: 'include' })
      setSuccess('Mantenimiento marcado como completado')
      fetchMaintenances()
      fetchVehicles()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error completing maintenance:', error)
    }
  }

  const handleReleaseFromMaintenance = async (vehicleId: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId)
      if (!vehicle) return

      const res = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: vehicleId,
          plate: vehicle.plate,
          type: vehicle.type,
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          status: 'disponible',
          driverId: null
        })
      })

      if (res.ok) {
        setSuccess('Vehículo liberado de mantenimiento')
        fetchMaintenances()
        fetchVehicles()
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Error releasing vehicle:', error)
    }
  }

  const openModal = () => {
    setRepuestosSeleccionados([])
    setError(null)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Mantenimientos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestión de mantenimientos del vehículo</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Mantenimiento
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-5 h-5" /></button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700"><X className="w-5 h-5" /></button>
        </div>
      )}

      <>
          {maintenanceVehicles.length > 0 && (
            <div className="mb-8">
              <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                Vehículos en Mantenimiento
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maintenanceVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-800/30 rounded-lg flex items-center justify-center">
                          <Car className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{vehicle.plate}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{vehicle.brand} {vehicle.model}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                      {vehicle.driver && (<p>Chofer: {vehicle.driver.name}</p>)}
                      {vehicle.color && <p>Color: {vehicle.color}</p>}
                      <p>Año: {vehicle.year}</p>
                    </div>
                    <button onClick={() => handleReleaseFromMaintenance(vehicle.id)} className="mt-3 w-full px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">
                      Liberar de Mantenimiento
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pending.length}</p>
                  <p className="text-gray-500 dark:text-gray-400">Pendientes</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{completed.length}</p>
                  <p className="text-gray-500 dark:text-gray-400">Completados</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 dark:bg-primary/30 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-primary dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{maintenances.length}</p>
                  <p className="text-gray-500 dark:text-gray-400">Total</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Vehículo</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Costo</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estado</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Cargando...</td></tr>
                  ) : maintenances.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No hay mantenimientos registrados</td></tr>
                  ) : (
                    maintenances.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4"><span className="font-medium text-gray-900 dark:text-white">{m.vehicle.plate}</span></td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.type === 'preventivo' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>{m.type}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{m.description}</td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{formatCurrency(m.cost)}</td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDateDDMMYYYY(m.date)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.status === 'pendiente' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>{m.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          {m.status === 'pendiente' && (
                            <button onClick={() => handleComplete(m.id)} className="text-sm text-primary hover:underline">Marcar completado</button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
      </>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-700 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-heading text-xl font-bold dark:text-white">Nuevo Mantenimiento</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form id="maintenance-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehículo</label>
                  <select name="vehicleId" required className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white">
                    <option value="">Seleccionar...</option>
                    {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                    <select name="type" required className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white">
                      <option value="preventivo">Preventivo</option>
                      <option value="correctivo">Correctivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                    <select name="category" required className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white">
                      <option value="revision">Revisión</option>
                      <option value="cambio_aceite">Cambio de aceite</option>
                      <option value="frenos">Frenos</option>
                      <option value="llantas">Llantas</option>
                      <option value="motor">Motor</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                  <textarea name="description" required rows={2} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white" placeholder="Descripción del mantenimiento..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo ($)</label>
                  <input type="number" name="cost" required min={0} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white" placeholder="50000" />
                </div>

                {/* Repuestos utilizados */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Repuestos utilizados <span className="font-normal text-gray-400">(opcional)</span></label>
                  </div>

                  {repuestosSeleccionados.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {repuestosSeleccionados.map((sel) => {
                        const rep = repuestos.find(r => r.id === sel.repuestoId)
                        if (!rep) return null
                        return (
                          <div key={sel.repuestoId} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl px-3 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {rep.nombre}
                                {rep.vehiculo?.plate && <span className="text-gray-400 font-normal"> · {rep.vehiculo.plate}</span>}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Stock: {rep.cantidadActual} · {formatCurrency(rep.precioUnitario)}/u
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={rep.cantidadActual}
                                value={sel.cantidad}
                                onChange={(e) => cambiarCantidad(sel.repuestoId, Number(e.target.value) || 1)}
                                className="w-16 px-2 py-1 text-sm text-center border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => quitarRepuesto(sel.repuestoId)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                aria-label="Quitar repuesto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {repuestosDisponibles.length > 0 ? (
                    <select
                      value=""
                      onChange={(e) => agregarRepuesto(e.target.value)}
                      className="w-full px-4 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none text-sm"
                    >
                      <option value="">+ Agregar repuesto...</option>
                      {repuestosDisponibles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} — stock: {r.cantidadActual}{r.vehiculo?.plate ? ` · ${r.vehiculo.plate}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : repuestos.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">No hay repuestos registrados</p>
                  ) : repuestosSeleccionados.length > 0 && repuestosDisponibles.length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">Todos los repuestos con stock fueron agregados</p>
                  ) : null}
                </div>
              </form>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl" disabled={submitting}>Cancelar</button>
              <button type="submit" form="maintenance-form" disabled={submitting} className="flex-1 px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-800 disabled:opacity-50">
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
