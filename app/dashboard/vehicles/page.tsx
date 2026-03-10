'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Plus, Trash2, Search } from 'lucide-react'

interface Vehicle {
  id: string
  plate: string
  type: string
  brand: string
  model: string
  year: number
  color: string | null
  status: string
  weeklyRate: number
  driver: { id: string; name: string } | null
  _count: { maintenances: number; expenses: number; incomes: number }
}

interface Driver {
  id: string
  name: string
  phone: string | null
  vehicleId: string | null
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchVehicles()
    fetchDrivers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchVehicles = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/vehicles', { credentials: 'include' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Error al cargar vehículos')
        return
      }
      const data = await res.json()
      setVehicles(data.vehicles || [])
      setError(null)
    } catch (error) {
      console.error('Error fetching vehicles:', error)
      setError('Error de conexión')
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  const fetchDrivers = async () => {
    try {
      const res = await fetch('/api/drivers', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setDrivers(data.drivers || [])
      }
    } catch (error) {
      console.error('Error fetching drivers:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      disponible: 'bg-green-100 text-green-700',
      alquilado: 'bg-blue-100 text-blue-700',
      mantenimiento: 'bg-orange-100 text-orange-700'
    }
    return styles[status] || styles.disponible
  }

  const getTypeBadge = (type: string) => {
    return type === 'taxi' 
      ? 'bg-yellow-100 text-yellow-700' 
      : 'bg-purple-100 text-purple-700'
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const driverId = formData.get('driverId')?.toString() || null
    
    const vehicleData = {
      ...(editingVehicle && { id: editingVehicle.id }),
      plate: formData.get('plate')?.toString().trim() || '',
      type: formData.get('type')?.toString() || '',
      brand: formData.get('brand')?.toString().trim() || '',
      model: formData.get('model')?.toString().trim() || '',
      year: formData.get('year')?.toString() || '',
      color: formData.get('color')?.toString().trim() || null,
      weeklyRate: formData.get('weeklyRate')?.toString() || '120000',
      status: formData.get('status')?.toString() || 'disponible',
      driverId: driverId === '' ? null : driverId
    }
    
    try {
      const res = await fetch('/api/vehicles', {
        method: editingVehicle ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(vehicleData)
      })
      
      const data = await res.json()
      
      if (res.status === 401) {
        router.push('/login')
        return
      }
      
      if (!res.ok) {
        setError(data.error || (editingVehicle ? 'Error al actualizar vehículo' : 'Error al crear vehículo'))
        return
      }
      
      setShowModal(false)
      setEditingVehicle(null)
      await fetchVehicles()
      await fetchDrivers()
    } catch (error) {
      console.error('Error saving vehicle:', error)
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditModal = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingVehicle(null)
    setError(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar vehículo?')) return
    
    try {
      const formData = new FormData()
      formData.append('_action', 'delete')
      
      await fetch(`/api/vehicles/${id}`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      fetchVehicles()
    } catch (error) {
      console.error('Error deleting vehicle:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Vehículos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestión completa de vehículos</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por placa..."
              className="w-full pl-12 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Vehículo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              onClick={() => openEditModal(vehicle)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
            >
              <div className="h-3 bg-primary" />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-xl font-bold text-gray-900 dark:text-white">{vehicle.plate}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(vehicle.type)}`}>
                        {vehicle.type === 'taxi' ? 'Taxi' : 'Colectivo'}
                      </span>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">{vehicle.brand} {vehicle.model}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(vehicle.status)}`}>
                    {vehicle.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Año:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{vehicle.year}</span>
                  </div>
                  {vehicle.color && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Color:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{vehicle.color}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Chofer:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{vehicle.driver?.name || 'Sin asignar'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-orange-600 dark:text-orange-400">{vehicle._count.maintenances}</span> mantenimientos
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(vehicle.id) }}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {vehicles.length === 0 && !loading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Car className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay vehículos registrados</p>
        </div>
      )}

      {/* Add/Edit Vehicle Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-bold mb-4 dark:text-white">
              {editingVehicle ? 'Editar Vehículo' : 'Agregar Vehículo'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Placa</label>
                  <input
                    type="text"
                    name="plate"
                    required
                    defaultValue={editingVehicle?.plate}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="ABC-123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                  <select
                    name="type"
                    required
                    defaultValue={editingVehicle?.type}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                  >
                    <option value="taxi">Taxi</option>
                    <option value="colectivo">Colectivo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                  <input
                    type="text"
                    name="brand"
                    required
                    defaultValue={editingVehicle?.brand}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modelo</label>
                  <input
                    type="text"
                    name="model"
                    required
                    defaultValue={editingVehicle?.model}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Corolla"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año</label>
                  <input
                    type="number"
                    name="year"
                    required
                    min={1990}
                    max={2030}
                    defaultValue={editingVehicle?.year}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                  <input
                    type="text"
                    name="color"
                    defaultValue={editingVehicle?.color || ''}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                    placeholder="Blanco"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarifa Semanal ($)</label>
                <input
                  type="number"
                  name="weeklyRate"
                  defaultValue={editingVehicle?.weeklyRate || 120000}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="120000"
                />
              </div>
              {editingVehicle && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                  <select
                    name="status"
                    defaultValue={editingVehicle.status}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                  >
                    <option value="disponible">Disponible</option>
                    <option value="alquilado">Alquilado</option>
                    <option value="mantenimiento">Mantenimiento</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chofer</label>
                <select
                  name="driverId"
                  defaultValue={editingVehicle?.driver?.id || ''}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none overflow-visible bg-white dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Sin asignar</option>
                  {drivers
                    .filter(d => !d.vehicleId || d.vehicleId === editingVehicle?.id)
                    .map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-800 disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
