'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Pencil, Plus, Trash2, X } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import { formatCurrencyCLP, formatDateDDMMYYYY } from '@/lib/format'

type Vehicle = {
  id: string
  plate: string
  brand?: string
  model?: string
}

type Repuesto = {
  id: string
  nombre: string
  descripcion: string | null
  cantidad: number
  precioUnitario: number
  proveedor: string | null
  fechaCompra: string
  vehiculo: Vehicle | null
  vehiculoId: string | null
}

function toISODateInputValue(date: Date) {
  const yyyy = String(date.getUTCFullYear())
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function dateInputToUtcNoonIso(value: string) {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value)
  if (!m) return value
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0)).toISOString()
}

export default function RepuestosPage() {
  const router = useRouter()

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [repuestos, setRepuestos] = useState<Repuesto[]>([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Repuesto | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles', { credentials: 'include' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = await res.json()
      setVehicles((json?.vehicles || []) as Vehicle[])
    } catch {
      setVehicles([])
    }
  }, [router])

  const fetchRepuestos = useCallback(async () => {
    try {
      const res = await fetch('/api/repuestos', { credentials: 'include' })
      if (res.status === 401) {
        router.push('/login')
        return
      }
      const json = await res.json()
      setRepuestos((json?.repuestos || []) as Repuesto[])
    } catch {
      setRepuestos([])
      setError('Error al cargar repuestos')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    Promise.all([fetchVehicles(), fetchRepuestos()])
  }, [fetchVehicles, fetchRepuestos])

  const openCreate = () => {
    setEditing(null)
    setError(null)
    setShowModal(true)
  }

  const openEdit = (r: Repuesto) => {
    setEditing(r)
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    const payload = {
      ...(editing ? { id: editing.id } : {}),
      vehiculoId: (formData.get('vehiculoId') as string) || null,
      nombre: (formData.get('nombre') as string) || '',
      descripcion: (formData.get('descripcion') as string) || '',
      cantidad: (formData.get('cantidad') as string) || '1',
      precioUnitario: (formData.get('precioUnitario') as string) || '0',
      proveedor: (formData.get('proveedor') as string) || '',
      fechaCompra: (formData.get('fechaCompra') as string) || '',
    }

    const nombreTrim = String(payload.nombre || '').trim()
    const cantidadNum = Number.parseInt(String(payload.cantidad ?? ''), 10)
    const precioNum = Number.parseFloat(String(payload.precioUnitario ?? ''))
    if (!nombreTrim) {
      setError('El nombre es obligatorio')
      setSubmitting(false)
      return
    }
    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
      setError('La cantidad es obligatoria y debe ser mayor a 0')
      setSubmitting(false)
      return
    }
    if (!Number.isFinite(precioNum) || precioNum < 0) {
      setError('El precio unitario es obligatorio y debe ser válido')
      setSubmitting(false)
      return
    }
    if (!payload.fechaCompra) {
      setError('La fecha de compra es obligatoria')
      setSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/repuestos', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...payload,
          nombre: nombreTrim,
          fechaCompra: dateInputToUtcNoonIso(payload.fechaCompra),
        }),
      })

      const json = await res.json().catch(() => ({}))

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        setError(json?.error || (editing ? 'Error al actualizar repuesto' : 'Error al registrar repuesto'))
        return
      }

      setSuccess(editing ? 'Repuesto actualizado' : 'Repuesto registrado')
      closeModal()
      await fetchRepuestos()
      setTimeout(() => setSuccess(null), 2500)
    } catch {
      setError('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  const requestDelete = (id: string) => {
    setConfirmDeleteId(id)
    setConfirmDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return

    setDeletingId(confirmDeleteId)
    setError(null)

    try {
      const res = await fetch('/api/repuestos', {
        method: 'DELETE',
        credentials: 'include',
        body: JSON.stringify({ id: confirmDeleteId }),
        headers: { 'Content-Type': 'application/json' },
      })

      const json = await res.json().catch(() => ({}))

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        setError(json?.error || 'Error al eliminar repuesto')
        return
      }

      setSuccess('Repuesto eliminado')
      await fetchRepuestos()
      setTimeout(() => setSuccess(null), 2500)
    } catch {
      setError('Error de conexión')
    } finally {
      setDeletingId(null)
      setConfirmDeleteOpen(false)
      setConfirmDeleteId(null)
    }
  }

  const totalGasto = useMemo(() => {
    return repuestos.reduce((acc, r) => acc + (Number(r.cantidad) || 0) * (Number(r.precioUnitario) || 0), 0)
  }, [repuestos])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Repuestos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Registro de artículos y repuestos (no mantenimientos)</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Registrar repuesto
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-between">
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Cerrar mensaje de error">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl flex items-center justify-between">
          <span className="text-sm">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700" aria-label="Cerrar mensaje de éxito">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">Repuestos registrados</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : repuestos.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 md:col-span-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">Gasto total (lista)</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '—' : formatCurrencyCLP(totalGasto)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Vehículo</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cantidad</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Precio unitario</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Costo total</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Proveedor</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Cargando...</td>
                </tr>
              ) : repuestos.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No hay repuestos registrados</td>
                </tr>
              ) : (
                repuestos.map((r) => {
                  const costoTotal = (Number(r.cantidad) || 0) * (Number(r.precioUnitario) || 0)
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium whitespace-nowrap">{r.vehiculo?.plate || 'General'}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{r.nombre}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300 min-w-[240px]">{r.descripcion || '—'}</td>
                      <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{r.cantidad}</td>
                      <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{formatCurrencyCLP(Number(r.precioUnitario) || 0)}</td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">{formatCurrencyCLP(costoTotal)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{r.proveedor || '—'}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDateDDMMYYYY(r.fechaCompra)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                            aria-label="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            aria-label="Eliminar repuesto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Eliminar repuesto"
        message="¿Estás seguro de eliminar este repuesto? Esta acción no se puede deshacer."
        confirming={!!deletingId}
        onCancel={() => {
          setConfirmDeleteOpen(false)
          setConfirmDeleteId(null)
        }}
        onConfirm={handleDelete}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold dark:text-white">{editing ? 'Editar repuesto' : 'Registrar repuesto'}</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehículo (opcional)</label>
                <select
                  name="vehiculoId"
                  defaultValue={editing?.vehiculoId || ''}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                >
                  <option value="">General</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate}{v.brand || v.model ? ` - ${v.brand || ''} ${v.model || ''}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                  <input
                    name="nombre"
                    type="text"
                    required
                    defaultValue={editing?.nombre || ''}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                    placeholder="Batería"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
                  <input
                    name="proveedor"
                    type="text"
                    defaultValue={editing?.proveedor || ''}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                    placeholder="Proveedor"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  rows={2}
                  defaultValue={editing?.descripcion || ''}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                  placeholder="Detalles del repuesto..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                  <input
                    name="cantidad"
                    type="number"
                    min={1}
                    step={1}
                    required
                    defaultValue={String(editing?.cantidad ?? 1)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio unitario</label>
                  <input
                    name="precioUnitario"
                    type="number"
                    min={0}
                    step="1"
                    required
                    defaultValue={String(Number(editing?.precioUnitario) || 0)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de compra</label>
                  <input
                    name="fechaCompra"
                    type="date"
                    required
                    defaultValue={toISODateInputValue(new Date(editing?.fechaCompra || new Date().toISOString()))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                  />
                </div>
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

      {!loading && repuestos.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Package className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay repuestos registrados</p>
        </div>
      )}
    </div>
  )
}
