'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Download, 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  AlertCircle, 
  Users, 
  Calendar, 
  TrendingUp 
} from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import PaymentReceiptModal from '@/components/PaymentReceiptModal'
import { formatCurrencyCLP, formatDateDDMMYYYY } from '@/lib/format'
import { exportReporteFinancieroSemanalExcel, exportReporteFinancieroSemanalPDF } from '@/lib/exportUtils'

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
}

interface DriverOption {
  id: string
  name: string
}

interface PagoSemanal {
  id: string
  conductorId: string
  vehiculoId: string
  fechaPago?: string
  tipoPago?: 'abono' | 'completo' | string
  semanaInicio: string
  semanaFin: string
  monto: number
  estado: string
  observaciones: string | null
  comprobanteUrl?: string | null
  createdAt: string
  conductor: { id: string; name: string }
  vehiculo: { id: string; plate: string; brand: string; model: string; weeklyRate?: number }
}

interface ResumenFinanzas {
  semanaInicio: string
  semanaFin: string
  totalRecaudadoSemana: number
  totalRecaudadoMes: number
  pagosPendientes: number
  conductoresPagados: number
}

function formatDate(date: string | Date) {
  return formatDateDDMMYYYY(date)
}

function formatCurrency(amount: number) {
  return formatCurrencyCLP(amount)
}

function toISODateInputValue(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

function parseDateInputValue(value: string) {
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value)
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const da = Number(m[3])
  if (!y || !mo || !da) return null
  return new Date(y, mo - 1, da, 12, 0, 0, 0)
}

function formatWeekLabel(weekStart: Date, weekEnd: Date) {
  return `Lunes ${formatDate(weekStart)} - Domingo ${formatDate(weekEnd)}`
}

function getWeekRangeFor(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0 Sunday
  const diffToMonday = (day + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { weekStart: monday, weekEnd: sunday }
}

function getEstadoSemanal(totalAbonado: number, cuotaSemanal: number) {
  if (!totalAbonado || totalAbonado <= 0) return 'Pendiente'
  if (cuotaSemanal > 0 && totalAbonado >= cuotaSemanal) return 'Pagado'
  return 'Parcial'
}

async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > 1200) {
        height = (height * 1200) / width
        width = 1200
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear contexto de canvas'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      let quality = 0.7
      let blob: Blob | null = null

      const tryCompress = (q: number): void => {
        canvas.toBlob(
          (b) => {
            if (!b) {
              reject(new Error('Error al comprimir imagen'))
              return
            }
            blob = b
            if (b.size > 300 * 1024 && q > 0.1) {
              tryCompress(q - 0.1)
            } else {
              const compressedFile = new File([blob!], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
              })
              resolve(compressedFile)
            }
          },
          'image/jpeg',
          q
        )
      }

      tryCompress(quality)
    }
    img.onerror = () => reject(new Error('Error al cargar imagen'))
    img.src = URL.createObjectURL(file)
  })
}

async function uploadComprobante(file: File) {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])
  if (!allowed.has(file.type)) {
    throw new Error('Formato no permitido. Solo JPG, PNG o WEBP.')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Archivo demasiado grande. Máximo 5MB.')
  }

  const fd = new FormData()
  fd.append('file', file)

  const res = await fetch('/api/uploads/comprobante', {
    method: 'POST',
    credentials: 'include',
    body: fd,
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || 'Error al subir comprobante')
  }
  if (!data?.url || typeof data.url !== 'string') {
    throw new Error('No se pudo obtener URL del comprobante')
  }

  return data.url as string
}

export default function FinancesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [pagos, setPagos] = useState<PagoSemanal[]>([])
  const [resumen, setResumen] = useState<ResumenFinanzas | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [comprimidoFile, setComprimidoFile] = useState<File | null>(null)
  const [editingPago, setEditingPago] = useState<PagoSemanal | null>(null)

  const now = new Date()
  const initialRange = getWeekRangeFor(now)
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(toISODateInputValue(now))
  const [filtroConductorId, setFiltroConductorId] = useState<string>('')
  const [filtroVehiculoId, setFiltroVehiculoId] = useState<string>('')
  const [semanaInicio, setSemanaInicio] = useState<string>(toISODateInputValue(initialRange.weekStart))
  const [semanaFin, setSemanaFin] = useState<string>(toISODateInputValue(initialRange.weekEnd))

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const router = useRouter()

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingPayment, setDeletingPayment] = useState(false)

  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptPago, setReceiptPago] = useState<PagoSemanal | null>(null)

  const fetchBaseData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [vehiclesRes, driversRes] = await Promise.all([
        fetch('/api/vehicles', { credentials: 'include' }),
        fetch('/api/drivers', { credentials: 'include' })
      ])

      if (vehiclesRes.status === 401 || driversRes.status === 401) {
        router.push('/login')
        return
      }
      const [vehiclesData, driversData] = await Promise.all([
        vehiclesRes.json(),
        driversRes.json()
      ])

      if (vehiclesRes.ok) setVehicles((vehiclesData?.vehicles || []) as Vehicle[])
      if (driversRes.ok) setDrivers((driversData?.drivers || []) as DriverOption[])
    } catch (e) {
      console.error('Error fetching base data:', e)
      setError('Error al cargar datos')
      setVehicles([])
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }, [router])

  const requestDelete = (id: string) => {
    setConfirmDeleteId(id)
    setConfirmDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!confirmDeleteId) return
    setError(null)
    setSuccess(null)
    setDeletingPayment(true)
    try {
      const res = await fetch(`/api/finances/payments?id=${encodeURIComponent(confirmDeleteId)}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        setError(data?.error || 'Error al eliminar pago')
        return
      }
      setSuccess('Pago eliminado')
      await fetchPagosYResumen()
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      console.error('Error deleting payment:', e)
      setError('Error de conexión')
    } finally {
      setDeletingPayment(false)
      setConfirmDeleteOpen(false)
      setConfirmDeleteId(null)
    }
  }

  const openEdit = (p: PagoSemanal) => {
    setEditingPago(p)
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!editingPago) return

    const formData = new FormData(e.currentTarget)
    const fechaSel = formData.get('fechaPago') as string
    const monto = formData.get('monto') as string
    const tipoPago = (formData.get('tipoPago') as string) || 'abono'

    const fechaPago = fechaSel ? parseDateInputValue(fechaSel) : null
    if (!fechaPago) {
      setError('Fecha de pago inválida')
      return
    }

    try {
      const res = await fetch('/api/finances/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: editingPago.id,
          fechaPago: fechaPago.toISOString(),
          tipoPago,
          monto
        })
      })

      const data = await res.json()
      if (res.status === 401) {
        router.push('/login')
        return
      }
      if (!res.ok) {
        setError(data?.error || 'Error al actualizar pago')
        return
      }
      setSuccess('Pago actualizado')
      setShowEditModal(false)
      setEditingPago(null)
      await fetchPagosYResumen()
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      console.error('Error updating payment:', e)
      setError('Error de conexión')
    }
  }

  const fetchPagosYResumen = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fechaBase = fechaSeleccionada ? parseDateInputValue(fechaSeleccionada) : null
      const params = new URLSearchParams()
      if (filtroConductorId) params.set('conductorId', filtroConductorId)
      if (filtroVehiculoId) params.set('vehiculoId', filtroVehiculoId)
      if (fechaBase) {
        params.set('fechaSeleccionada', fechaBase.toISOString())
      }

      const rangeForSummary = fechaBase ? getWeekRangeFor(fechaBase) : null

      const [pagosRes, resumenRes] = await Promise.all([
        fetch(`/api/finances/payments?${params.toString()}`, { credentials: 'include' }),
        fetch(`/api/finances/summary?${new URLSearchParams({
          fechaSeleccionada: (fechaBase || undefined)?.toISOString() || '',
          semanaInicio: (rangeForSummary ? rangeForSummary.weekStart : parseDateInputValue(semanaInicio))?.toISOString() || new Date().toISOString(),
          semanaFin: (rangeForSummary ? rangeForSummary.weekEnd : parseDateInputValue(semanaFin))?.toISOString() || new Date().toISOString()
        }).toString()}`, { credentials: 'include' })
      ])

      if (pagosRes.status === 401 || resumenRes.status === 401) {
        router.push('/login')
        return
      }

      const [pagosData, resumenData] = await Promise.all([
        pagosRes.json(),
        resumenRes.json()
      ])

      if (!pagosRes.ok) throw new Error(pagosData?.error || 'Error al cargar pagos')
      if (!resumenRes.ok) throw new Error(resumenData?.error || 'Error al cargar resumen')

      setPagos((pagosData?.pagos || []) as PagoSemanal[])
      setResumen(resumenData as ResumenFinanzas)
    } catch (e: any) {
      console.error('Error fetching payments/summary:', e)
      setError(e?.message || 'Error al cargar información')
      setPagos([])
      setResumen(null)
    } finally {
      setLoading(false)
    }
  }, [filtroConductorId, filtroVehiculoId, fechaSeleccionada, semanaInicio, semanaFin, router])

  useEffect(() => {
    if (!fechaSeleccionada) return
    const fechaBase = parseDateInputValue(fechaSeleccionada)
    if (!fechaBase) return
    const range = getWeekRangeFor(fechaBase)
    setSemanaInicio(toISODateInputValue(range.weekStart))
    setSemanaFin(toISODateInputValue(range.weekEnd))
  }, [fechaSeleccionada])

  useEffect(() => {
    fetchBaseData()
  }, [fetchBaseData])

  useEffect(() => {
    fetchPagosYResumen()
  }, [fetchPagosYResumen])

  const totalTabla = useMemo(() => {
    return pagos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)
  }, [pagos])

  const estadoPorGrupo = useMemo(() => {
    const totals = new Map<string, { total: number; cuota: number }>()
    for (const p of pagos) {
      const cuota = Number(p?.vehiculo?.weeklyRate) || 0
      const key = `${p.conductorId}::${p.vehiculoId}`
      const current = totals.get(key)
      if (!current) {
        totals.set(key, { total: Number(p.monto) || 0, cuota })
      } else {
        current.total += Number(p.monto) || 0
        current.cuota = current.cuota || cuota
      }
    }

    const estado = new Map<string, { estado: string; total: number; cuota: number }>()
    for (const [key, v] of Array.from(totals.entries())) {
      estado.set(key, { estado: getEstadoSemanal(v.total, v.cuota), total: v.total, cuota: v.cuota })
    }
    return estado
  }, [pagos])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)
    const conductorId = formData.get('conductorId') as string
    const vehiculoId = formData.get('vehiculoId') as string
    const fechaSel = formData.get('fechaSeleccionada') as string
    const monto = formData.get('monto') as string
    const tipoPago = (formData.get('tipoPago') as string) || 'abono'
    const observaciones = (formData.get('observaciones') as string) || ''
    const comprobanteFile = formData.get('comprobante')

    const fechaPago = fechaSel ? parseDateInputValue(fechaSel) : null

    try {
      if (!fechaPago) throw new Error('Fecha de pago inválida')

      let comprobanteUrl: string | null = null
      const fileToUpload = comprimidoFile || (comprobanteFile && comprobanteFile instanceof File && comprobanteFile.size > 0 ? comprobanteFile : null)
      if (fileToUpload) {
        comprobanteUrl = await uploadComprobante(fileToUpload)
      }

      const res = await fetch('/api/finances/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conductorId,
          vehiculoId,
          fechaPago: fechaPago.toISOString(),
          fechaSeleccionada: fechaPago.toISOString(),
          tipoPago,
          monto,
          observaciones: observaciones.trim() ? observaciones.trim() : null,
          comprobanteUrl
        })
      })

      const data = await res.json()

      if (res.status === 401) {
        router.push('/login')
        return
      }

      if (!res.ok) {
        setError(data?.error || 'Error al registrar pago')
        return
      }

      setSuccess('Pago registrado')
      setShowModal(false)
      setComprimidoFile(null)
      await fetchPagosYResumen()
      setTimeout(() => setSuccess(null), 2500)
    } catch (e) {
      console.error('Error saving payment:', e)
      setError('Error de conexión')
    }
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const totalAbonos = pagos.reduce(
        (sum, p) => sum + (((p.tipoPago || 'abono') === 'completo') ? 0 : (Number(p.monto) || 0)),
        0
      )
      const totalCompletos = pagos.reduce(
        (sum, p) => sum + (((p.tipoPago || 'abono') === 'completo') ? (Number(p.monto) || 0) : 0),
        0
      )

      const start = parseDateInputValue(semanaInicio)
      const end = parseDateInputValue(semanaFin)

      exportReporteFinancieroSemanalPDF({
        pagos: pagos.map((p) => ({
          conductor: p.conductor?.name || 'N/A',
          vehiculo: `${p.vehiculo?.plate || ''} ${p.vehiculo?.brand || ''} ${p.vehiculo?.model || ''}`.trim(),
          fechaPago: (p.fechaPago as any) || p.createdAt,
          tipoPago: (p.tipoPago as any) || 'abono',
          monto: Number(p.monto) || 0,
          semanaInicio: p.semanaInicio,
          semanaFin: p.semanaFin
        })),
        semanaInicio: (start || new Date()).toISOString(),
        semanaFin: (end || new Date()).toISOString(),
        totalPagado: totalTabla,
        totalAbonos,
        totalCompletos
      })
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    setExporting(true)
    try {
      exportReporteFinancieroSemanalExcel({
        pagos: pagos.map((p) => ({
          conductor: p.conductor?.name || 'N/A',
          vehiculo: `${p.vehiculo?.plate || ''} ${p.vehiculo?.brand || ''} ${p.vehiculo?.model || ''}`.trim(),
          fechaPago: (p.fechaPago as any) || p.createdAt,
          tipoPago: (p.tipoPago as any) || 'abono',
          monto: Number(p.monto) || 0,
          semanaInicio: p.semanaInicio,
          semanaFin: p.semanaFin
        })),
        totalPagado: totalTabla
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Finanzas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Registro de pagos semanales</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-primary-800 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Registrar Pago
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting || pagos.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exporting || pagos.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Exportar Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700" aria-label="Cerrar mensaje de error"><X className="w-5 h-5" /></button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl flex items-center justify-between">
          <span className="text-sm">{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700" aria-label="Cerrar mensaje de éxito"><X className="w-5 h-5" /></button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total recaudado esta semana</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(resumen?.totalRecaudadoSemana || 0)}</p>
            </div>
            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/30 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total recaudado este mes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(resumen?.totalRecaudadoMes || 0)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pagos pendientes</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{resumen?.pagosPendientes || 0}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Conductores pagados</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{resumen?.conductoresPagados || 0}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-700 dark:text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha seleccionada</label>
            <input
              type="date"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl outline-none bg-white dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semana</label>
            <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">
              <div className="text-sm text-gray-500 dark:text-gray-400">Semana:</div>
              <div>
                {(() => {
                  const start = parseDateInputValue(semanaInicio)
                  const end = parseDateInputValue(semanaFin)
                  if (!start || !end) return '—'
                  return formatWeekLabel(start, end)
                })()}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conductor</label>
            <select
              value={filtroConductorId}
              onChange={(e) => setFiltroConductorId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl outline-none bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehículo</label>
            <select
              value={filtroVehiculoId}
              onChange={(e) => setFiltroVehiculoId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl outline-none bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">Todos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Conductor</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Vehículo</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Semana</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Monto</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estado semanal</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Fecha pago</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Comprobante</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Cargando...</td></tr>
              ) : pagos.length === 0 ? (
                <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No hay pagos registrados</td></tr>
              ) : (
                pagos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">{p.conductor?.name}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{p.vehiculo?.plate} - {p.vehiculo?.brand} {p.vehiculo?.model}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{formatDate(p.semanaInicio)} - {formatDate(p.semanaFin)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900 dark:text-white">{formatCurrency(Number(p.monto) || 0)}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{(p.tipoPago || 'abono') === 'completo' ? 'Pago completo' : 'Abono'}</td>
                    <td className="px-6 py-4">
                      {(() => {
                        const key = `${p.conductorId}::${p.vehiculoId}`
                        const info = estadoPorGrupo.get(key)
                        const estado = info?.estado || 'Pendiente'
                        const cls = estado === 'Pagado'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : estado === 'Parcial'
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        return (
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex w-fit ${cls}`}>{estado}</span>
                            {info && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatCurrency(info.total)} / {formatCurrency(info.cuota || 0)}
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{formatDate((p.fechaPago as any) || p.createdAt)}</td>
                    <td className="px-6 py-4">
                      {p.comprobanteUrl ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptPago(p)
                              setReceiptOpen(true)
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                          >
                            Ver comprobante
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!p.comprobanteUrl) return
                              const d = new Date((p.fechaPago as any) || p.createdAt)
                              const dd = String(d.getDate()).padStart(2, '0')
                              const mm = String(d.getMonth() + 1).padStart(2, '0')
                              const yyyy = d.getFullYear()
                              const plate = (p.vehiculo?.plate || 'SIN-PATENTE').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
                              const fname = `${plate}-${dd}-${mm}-${yyyy}.jpg`
                              const res = await fetch(p.comprobanteUrl)
                              const blob = await res.blob()
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = fname
                              document.body.appendChild(a)
                              a.click()
                              document.body.removeChild(a)
                              URL.revokeObjectURL(url)
                            }}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm"
                            aria-label="Descargar comprobante"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requestDelete(p.id)}
                          className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Eliminar pago"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-end text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Total en tabla:</span>
          <span className="ml-2 font-semibold">{formatCurrency(totalTabla)}</span>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold dark:text-white">Registrar Pago</h3>
              <button onClick={() => { setShowModal(false); setComprimidoFile(null) }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conductor</label>
                  <select name="conductorId" required className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none">
                    <option value="">Seleccionar...</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehículo</label>
                  <select name="vehiculoId" required className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none">
                    <option value="">Seleccionar...</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha seleccionada</label>
                  <input
                    name="fechaSeleccionada"
                    type="date"
                    required
                    defaultValue={fechaSeleccionada}
                    onChange={(e) => setFechaSeleccionada(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Semana</label>
                  <div className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Semana:</div>
                    <div>
                      {(() => {
                        const start = parseDateInputValue(semanaInicio)
                        const end = parseDateInputValue(semanaFin)
                        if (!start || !end) return '—'
                        return formatWeekLabel(start, end)
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto pagado</label>
                  <input name="monto" type="number" min={0} step="1" required className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none" placeholder="120000" />
                </div>
                <div className="flex items-end">
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de pago</label>
                    <select name="tipoPago" defaultValue="abono" className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none">
                      <option value="abono">Abono (pago parcial)</option>
                      <option value="completo">Pago completo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones (opcional)</label>
                <textarea name="observaciones" rows={3} className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none" placeholder="Detalles del pago..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subir comprobante (opcional)</label>
                <input
                  name="comprobante"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    console.log('Tamaño original:', (file.size / 1024).toFixed(2) + 'KB')
                    try {
                      const compressed = await compressImage(file)
                      console.log('Tamaño comprimido:', (compressed.size / 1024).toFixed(2) + 'KB')
                      setComprimidoFile(compressed)
                    } catch (err) {
                      console.error('Error al comprimir:', err)
                    }
                  }}
                />
                {comprimidoFile && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">Imagen comprimida lista para subir</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Formatos: JPG, PNG, WEBP. Máximo 5MB.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setComprimidoFile(null) }} className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-800">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingPago && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-xl font-bold dark:text-white">Editar Pago</h3>
              <button onClick={() => { setShowEditModal(false); setEditingPago(null) }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de pago</label>
                  <input
                    name="fechaPago"
                    type="date"
                    required
                    defaultValue={toISODateInputValue(new Date((editingPago.fechaPago as any) || editingPago.createdAt))}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de pago</label>
                  <select
                    name="tipoPago"
                    defaultValue={(editingPago.tipoPago as any) || 'abono'}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                  >
                    <option value="abono">Abono (pago parcial)</option>
                    <option value="completo">Pago completo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto</label>
                <input
                  name="monto"
                  type="number"
                  min={0}
                  step="1"
                  required
                  defaultValue={String(Number(editingPago.monto) || 0)}
                  className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingPago(null) }} className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-1 px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary-800">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiptOpen && receiptPago?.comprobanteUrl && (
        <PaymentReceiptModal
          open={receiptOpen}
          onClose={() => {
            setReceiptOpen(false)
            setReceiptPago(null)
          }}
          comprobanteUrl={receiptPago.comprobanteUrl}
          chofer={receiptPago.conductor?.name || 'N/A'}
          patente={receiptPago.vehiculo?.plate || '—'}
          fecha={(receiptPago.fechaPago as any) || receiptPago.createdAt}
          monto={Number(receiptPago.monto) || 0}
        />
      )}

      <ConfirmModal
        open={confirmDeleteOpen}
        title="Eliminar pago"
        message="¿Seguro que deseas eliminar este pago?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        confirming={deletingPayment}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false)
          setConfirmDeleteId(null)
        }}
      />
    </div>
  )
}
