'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, Phone, Car, Trash2, Edit2, X } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'

interface Driver {
  id: string
  name: string
  phone: string | null
  license: string | null
  vehicle: { id: string; plate: string } | null
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/drivers', { credentials: 'include' })
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        if (data.drivers) setDrivers(data.drivers)
      } catch (error) {
        console.error('Error fetching drivers:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDrivers()
  }, [router])

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/drivers', { credentials: 'include' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const data = await res.json()
      if (data.drivers) setDrivers(data.drivers)
    } catch (error) {
      console.error('Error fetching drivers:', error)
      setError('Error al cargar choferes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const driverData = {
      ...(editingDriver && { id: editingDriver.id }),
      name: formData.get('name')?.toString().trim() || '',
      phone: formData.get('phone')?.toString().trim() || null,
      license: formData.get('license')?.toString().trim() || null
    }

    if (!driverData.name) {
      setError('El nombre es requerido')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/drivers', {
        method: editingDriver ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(driverData)
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        setError(data.error || (editingDriver ? 'Error al actualizar chofer' : 'Error al crear chofer'))
        return
      }

      setSuccess(editingDriver ? 'Chofer actualizado exitosamente' : 'Chofer creado exitosamente')
      setShowModal(false)
      setEditingDriver(null)
      await fetchDrivers()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error saving driver:', error)
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    setError(null)

    try {
      const res = await fetch(`/api/drivers?id=${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        setError(data.error || 'Error al eliminar chofer')
        setDeletingId(null)
        return
      }

      setSuccess('Chofer eliminado exitosamente')
      await fetchDrivers()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error deleting driver:', error)
      setError('Error de conexión')
    } finally {
      setDeletingId(null)
    }
  }

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver)
    setShowModal(true)
    setError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDriver(null)
    setError(null)
  }

  const requestDelete = (driver: Driver) => {
    if (driver.vehicle) {
      setError('No se puede eliminar: el chofer tiene un vehículo asignado')
      return
    }
    setConfirmDeleteId(driver.id)
    setConfirmDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Conductores</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestión de conductores y licencias</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Agregar Conductor
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Cerrar mensaje de error">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700" aria-label="Cerrar mensaje de éxito">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/30 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-gray-900 dark:text-white">{driver.name}</h3>
                    {driver.vehicle && (
                      <p className="text-sm text-primary dark:text-primary-400 font-medium">{driver.vehicle.plate}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(driver)}
                    className="p-2 text-gray-400 hover:text-primary dark:hover:text-primary-400 transition-colors"
                    title="Editar"
                    aria-label="Editar conductor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => requestDelete(driver)}
                    disabled={deletingId === driver.id}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Eliminar"
                    aria-label="Eliminar conductor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                {driver.phone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-4 h-4" />
                    {driver.phone}
                  </div>
                )}
                {driver.license && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Car className="w-4 h-4" />
                    Licencia: {driver.license}
                  </div>
                )}
                {!driver.vehicle && (
                  <p className="text-orange-600 dark:text-orange-400 text-sm">Sin vehículo asignado</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {drivers.length === 0 && !loading && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay choferes registrados</p>
        </div>
      )}

      {/* Add/Edit Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-bold mb-4 dark:text-white">
              {editingDriver ? 'Editar Chofer' : 'Agregar Chofer'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingDriver?.name}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingDriver?.phone || ''}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="300 123 4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Licencia</label>
                <input
                  type="text"
                  name="license"
                  defaultValue={editingDriver?.license || ''}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white"
                  placeholder="12345678"
                />
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

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Eliminar conductor"
        message="¿Estás seguro de eliminar este conductor?"
        confirming={!!deletingId}
        onCancel={() => {
          setConfirmDeleteOpen(false)
          setConfirmDeleteId(null)
        }}
        onConfirm={() => {
          if (!confirmDeleteId) return
          handleDelete(confirmDeleteId)
          setConfirmDeleteOpen(false)
          setConfirmDeleteId(null)
        }}
      />
    </div>
  )
}
