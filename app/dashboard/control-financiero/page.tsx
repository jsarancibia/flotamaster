'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCurrencyCLP, formatDateDDMMYYYY } from '@/lib/format'

type Vehicle = {
  id: string
  plate: string
  brand?: string
  model?: string
}

type ControlFinancieroResponse = {
  filtros: { mes: number | null; anio: number; vehiculoId: string | null }
  resumen: { ingresosPeriodo: number; gastosPeriodo: number; gananciaNeta: number }
  graficos: {
    ingresosPorMes: Array<{ mes: string; ingresos: number }>
    gastosPorVehiculo: Array<{ vehiculo: string; gastos: number }>
    ingresosVsGastos: Array<{ mes: string; ingresos: number; gastos: number }>
  }
  movimientos: Array<{
    fecha: string
    tipo: 'Ingreso' | 'Gasto'
    vehiculo: string
    descripcion: string
    monto: number
  }>
}



function currentMonth1to12() {
  return new Date().getMonth() + 1
}

function currentYear() {
  return new Date().getFullYear()
}

const PIE_COLORS = ['#0D47A1', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4dabf7']

export default function ControlFinancieroPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  const [mes, setMes] = useState<number>(currentMonth1to12())
  const [anio, setAnio] = useState<number>(currentYear())
  const [vehiculoId, setVehiculoId] = useState<string>('')

  const [data, setData] = useState<ControlFinancieroResponse | null>(null)

  const queryString = useMemo(() => {
    const qs = new URLSearchParams()
    if (mes) qs.set('mes', String(mes))
    if (anio) qs.set('anio', String(anio))
    if (vehiculoId) qs.set('vehiculoId', vehiculoId)
    return qs.toString()
  }, [mes, anio, vehiculoId])

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles', { credentials: 'include' })
        if (res.status === 401) return
        const json = await res.json()
        const list = (json.vehicles || []) as any[]
        setVehicles(
          list.map((v) => ({
            id: v.id,
            plate: v.plate,
            brand: v.brand,
            model: v.model,
          }))
        )
      } catch {
        setVehicles([])
      }
    }

    loadVehicles()
  }, [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`/api/control-financiero?${queryString}`, { credentials: 'include' })
        if (res.status === 401) {
          setError('No autorizado')
          setData(null)
          return
        }
        const json = (await res.json()) as ControlFinancieroResponse & { error?: string }
        if (!res.ok) {
          setError(json.error || 'Error al cargar datos')
          setData(null)
          return
        }
        setData(json)
      } catch {
        setError('Error de conexión')
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [queryString])

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Control Financiero</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Ingresos, gastos y ganancia neta del período</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 mb-6 flex-wrap">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, '0')}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[140px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Año</label>
            <input
              type="number"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm"
            />
          </div>

          <div className="min-w-[220px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehículo</label>
            <select
              value={vehiculoId}
              onChange={(e) => setVehiculoId(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          {data ? (
            <span>
              Período: {mes ? String(mes).padStart(2, '0') : '—'}-{anio}
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Ingresos del período</p>
          <p className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            {loading || !data ? '—' : formatCurrencyCLP(data.resumen.ingresosPeriodo)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Gastos del período</p>
          <p className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            {loading || !data ? '—' : formatCurrencyCLP(data.resumen.gastosPeriodo)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Ganancia neta</p>
          <p className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            {loading || !data ? '—' : formatCurrencyCLP(data.resumen.gananciaNeta)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 min-w-0">
          <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-white mb-3">Ingresos por mes</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data?.graficos.ingresosPorMes || []}
                margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                barGap={6}
                barCategoryGap="22%"
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(v) => formatCurrencyCLP(Number(v) || 0)} />
                <Bar dataKey="ingresos" fill="#0D47A1" radius={[8, 8, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 min-w-0">
          <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-white mb-3">Gastos por vehículo</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(v) => formatCurrencyCLP(Number(v) || 0)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Pie
                  data={data?.graficos.gastosPorVehiculo || []}
                  dataKey="gastos"
                  nameKey="vehiculo"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {(data?.graficos.gastosPorVehiculo || []).map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 min-w-0">
          <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-white mb-3">Ingresos vs Gastos</h2>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.graficos.ingresosVsGastos || []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={70} />
                <Tooltip formatter={(v) => formatCurrencyCLP(Number(v) || 0)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="ingresos" stroke="#0D47A1" strokeWidth={3} dot />
                <Line type="monotone" dataKey="gastos" stroke="#FF8042" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-white">Movimientos financieros</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ingresos y gastos del período seleccionado</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Fecha</th>
                <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Vehículo</th>
                <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Descripción</th>
                <th className="text-right text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : !data || data.movimientos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    Sin movimientos
                  </td>
                </tr>
              ) : (
                data.movimientos.map((m, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">{formatDateDDMMYYYY(m.fecha)}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <span
                        className={
                          m.tipo === 'Ingreso'
                            ? 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                        }
                      >
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">{m.vehiculo || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 min-w-[260px]">{m.descripcion}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right whitespace-nowrap">
                      {formatCurrencyCLP(m.monto)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
