'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  DollarSign, 
  Car, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  Trash2, 
  FileText, 
  FileSpreadsheet,
  CreditCard,
  Receipt,
  Wallet,
  Calendar,
  Filter,
  Download
} from 'lucide-react'
import { exportFinanceReportPDF, exportFinanceReportExcel } from '@/lib/exportUtils'

interface Driver {
  id: string
  name: string
}

interface VehicleSummary {
  id: string
  plate: string
  brand: string
  model: string
  weeklyRate: number
}

interface Payment {
  id: string
  amount: number
  paid: boolean
  paidDate: string | null
  driverId: string
  driver: { name: string }
}

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  maintenanceId: string | null
}

interface FinancialSummary {
  vehicle: VehicleSummary
  driver: Driver | null
  payments: Payment[]
  expenses: Expense[]
  totalPayments: number
  manualExpenses: number
  maintenanceExpenses: number
  totalExpenses: number
  netProfit: number
  paymentStatus: boolean
  paymentId: string | null
}

interface WeekData {
  weekNumber: number
  year: number
  weekStart: string
  weekEnd: string
  summary: FinancialSummary[]
  totals: {
    totalPayments: number
    totalIncome: number
    totalExpenses: number
    netProfit: number
  }
}

interface Vehicle {
  id: string
  plate: string
  brand: string
  model: string
  weeklyRate: number
}

interface DriverOption {
  id: string
  name: string
  vehicleId: string | null
}

const EXPENSE_CATEGORIES = [
  { value: 'mantenimiento', label: 'Mantenimiento' },
  { value: 'combustible', label: 'Combustible' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'impuesto', label: 'Impuesto' },
  { value: 'lavado', label: 'Lavado' },
  { value: 'peaje', label: 'Peaje' },
  { value: 'otro', label: 'Otro' }
]

function getCurrentWeek() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  return Math.ceil(diff / oneWeek)
}

export default function FinancesPage() {
  const [weekData, setWeekData] = useState<WeekData | null>(null)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [loading, setLoading] = useState(true)
  const [weekNumber, setWeekNumber] = useState(getCurrentWeek())
  const [year, setYear] = useState(new Date().getFullYear())
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly')
  const [reportMonth, setReportMonth] = useState(new Date().getMonth())
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportData, setReportData] = useState<any>(null)
  const [exporting, setExporting] = useState(false)
  const router = useRouter()

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [financesRes, vehiclesRes, driversRes] = await Promise.all([
        fetch(`/api/finances/summary?weekNumber=${weekNumber}&year=${year}`, { credentials: 'include' }),
        fetch('/api/vehicles', { credentials: 'include' }),
        fetch('/api/drivers', { credentials: 'include' })
      ])

      const [financesData, vehiclesData, driversData] = await Promise.all([
        financesRes.json(),
        vehiclesRes.json(),
        driversRes.json()
      ])

      if (financesRes.ok) setWeekData(financesData)
      if (vehiclesRes.ok) {
        const vehiclesArray = Array.isArray(vehiclesData) 
          ? vehiclesData 
          : (vehiclesData?.vehicles || [])
        setVehicles(vehiclesArray)
      }
      if (driversRes.ok) {
        const driversArray = Array.isArray(driversData)
          ? driversData
          : (driversData?.drivers || [])
        setDrivers(driversArray)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Error al cargar datos')
      setVehicles([])
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }, [weekNumber, year])

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/finances?month=${reportMonth}&year=${reportYear}`, { credentials: 'include' })
      const data = await res.json()
      setReportData(data)
    } catch (error) {
      console.error('Error fetching report:', error)
      setError('Error al cargar reporte')
    } finally {
      setLoading(false)
    }
  }, [reportMonth, reportYear])

  useEffect(() => {
    if (viewMode === 'weekly') {
      fetchData()
    } else {
      fetchReportData()
    }
  }, [viewMode, fetchData, fetchReportData])

  const handleExportPDF = async () => {
    if (!reportData) await fetchReportData()
    const data = reportData || await (await fetch(`/api/reports/finances?month=${reportMonth}&year=${reportYear}`, { credentials: 'include' })).json()
    setExporting(true)
    try {
      exportFinanceReportPDF(data)
    } finally {
      setExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (!reportData) await fetchReportData()
    const data = reportData || await (await fetch(`/api/reports/finances?month=${reportMonth}&year=${reportYear}`, { credentials: 'include' })).json()
    setExporting(true)
    try {
      exportFinanceReportExcel(data)
    } finally {
      setExporting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const changeWeek = (delta: number) => {
    let newWeek = weekNumber + delta
    let newYear = year
    
    if (newWeek < 1) {
      newWeek = 52
      newYear -= 1
    } else if (newWeek > 52) {
      newWeek = 1
      newYear += 1
    }
    
    setWeekNumber(newWeek)
    setYear(newYear)
  }

  const openPaymentModal = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    setShowPaymentModal(true)
    setError(null)
  }

  const openExpenseModal = (vehicleId: string) => {
    setSelectedVehicle(vehicleId)
    setShowExpenseModal(true)
    setError(null)
  }

  const handleTogglePayment = async (paymentId: string, currentStatus: boolean) => {
    try {
      const payment = weekData?.summary
        .flatMap(s => s.payments.map(p => ({ ...p, vehicleId: s.vehicle.id, driverId: p.driverId })))
        .find(p => p.id === paymentId)
      
      if (!payment || !payment.driverId) return

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vehicleId: payment.vehicleId,
          driverId: payment.driverId,
          amount: payment.amount,
          weekNumber,
          year,
          paid: !currentStatus
        })
      })

      if (res.ok) {
        setSuccess(!currentStatus ? 'Pago marcado como pagado' : 'Pago marcado como pendiente')
        fetchData()
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Error toggling payment:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    
    try {
      const res = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (res.ok) {
        setSuccess('Gasto eliminado')
        fetchData()
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const amount = parseFloat(formData.get('amount') as string)
    const driverId = formData.get('driverId') as string
    const paymentDate = formData.get('paymentDate') as string

    if (!driverId) {
      setError('Selecciona un chofer')
      return
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          driverId,
          amount,
          weekNumber,
          year,
          paid: true,
          paymentDate
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrar pago')
        return
      }

      setSuccess('Pago registrado exitosamente')
      setShowPaymentModal(false)
      setSelectedVehicle(null)
      fetchData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error saving payment:', error)
      setError('Error de conexión')
    }
  }

  const handleExpenseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    
    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          category: formData.get('category'),
          description: formData.get('description'),
          amount: formData.get('amount'),
          expenseDate: formData.get('expense_date'),
          weekNumber,
          year
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrar gasto')
        return
      }

      setSuccess('Gasto registrado exitosamente')
      setShowExpenseModal(false)
      setSelectedVehicle(null)
      fetchData()
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('Error saving expense:', error)
      setError('Error de conexión')
    }
  }

  const vehiclesWithDriver = weekData?.summary.filter(s => s.driver) || []
  const vehiclesWithoutDriver = weekData?.summary.filter(s => !s.driver) || []

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {viewMode === 'weekly' ? 'Finanzas' : 'Reporte Mensual'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">
            {viewMode === 'weekly' 
              ? `Hoy: ${new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}` 
              : 'Resumen financiero mensual con exportaciones'}
          </p>
        </div>
        
        {/* Action Buttons - Grouped */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'weekly' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Semanal
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                viewMode === 'monthly' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Mensual
            </button>
          </div>

          {/* Export Buttons - Only show in monthly view */}
          {viewMode === 'monthly' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-all shadow-sm hover:shadow"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-all shadow-sm hover:shadow"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {viewMode === 'weekly' ? (
        <>
          {/* Week Navigation */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => changeWeek(-1)} 
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 px-4">
                <Calendar className="w-5 h-5 text-primary dark:text-primary-400" />
                <span className="font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
                  {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }).slice(1)}
                </span>
              </div>
              <button 
                onClick={() => changeWeek(1)} 
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Quick Stats Summary */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Ingresos:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(weekData?.totals.totalPayments || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Gastos:</span>
                <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(weekData?.totals.totalExpenses || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">Neto:</span>
                <span className={`font-semibold ${(weekData?.totals.netProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(weekData?.totals.netProfit || 0)}
                </span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-5 h-5" /></button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl flex items-center justify-between">
              <span className="text-sm">{success}</span>
              <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700"><X className="w-5 h-5" /></button>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowUpCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Pagos Recibidos</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(weekData?.totals.totalPayments || 0)}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ingresos</p>
              <p className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(weekData?.totals.totalIncome || 0)}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ArrowDownCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Gastos</p>
              <p className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(weekData?.totals.totalExpenses || 0)}</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-primary/10 dark:bg-primary/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-5 h-5 text-primary dark:text-primary-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ganancia Neta</p>
              <p className={`text-lg sm:text-xl font-bold ${(weekData?.totals.netProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(weekData?.totals.netProfit || 0)}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : !weekData || weekData.summary.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Car className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No hay vehículos registrados</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">Acciones:</span>
                <button
                  onClick={() => vehiclesWithDriver[0] && openPaymentModal(vehiclesWithDriver[0].vehicle.id)}
                  disabled={vehiclesWithDriver.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <CreditCard className="w-4 h-4" />
                  Registrar Pago
                </button>
                <button
                  onClick={() => vehiclesWithDriver[0] && openExpenseModal(vehiclesWithDriver[0].vehicle.id)}
                  disabled={vehiclesWithDriver.length === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Receipt className="w-4 h-4" />
                  Registrar Gasto
                </button>
              </div>

              {vehiclesWithDriver.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary dark:text-primary-400" />
                      Vehículos con Chofer ({vehiclesWithDriver.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {vehiclesWithDriver.map((item) => (
                      <div key={item.vehicle.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-lg transition-all">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center">
                              <Car className="w-6 h-6 text-primary dark:text-primary-400" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white text-base">{item.vehicle.plate}</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.vehicle.brand} {item.vehicle.model}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Driver Info */}
                        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{item.driver?.name}</span>
                        </div>
                        
                        {/* Financial Summary */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="text-center p-2.5 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Pago</p>
                            <p className="font-bold text-green-600 dark:text-green-400 text-sm">{formatCurrency(item.totalPayments)}</p>
                          </div>
                          <div className="text-center p-2.5 bg-red-50 dark:bg-red-900/20 rounded-xl">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Gastos</p>
                            <p className="font-bold text-red-600 dark:text-red-400 text-sm">{formatCurrency(item.totalExpenses)}</p>
                          </div>
                        </div>
                        
                        {/* Payment Status */}
                        <div className="flex items-center justify-between pt-3 mb-3 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            {item.paymentStatus ? (
                              <button 
                                onClick={() => item.paymentId && handleTogglePayment(item.paymentId, true)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-medium hover:bg-green-200 dark:hover:bg-green-900/50 transition-all"
                              >
                                <CheckCircle className="w-3.5 h-3.5" /> Pagado
                              </button>
                            ) : item.paymentId ? (
                              <button 
                                onClick={() => item.paymentId && handleTogglePayment(item.paymentId, false)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg text-xs font-medium hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-all"
                              >
                                <Circle className="w-3.5 h-3.5" /> Pendiente
                              </button>
                            ) : (
                              <button 
                                onClick={() => openPaymentModal(item.vehicle.id)} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all"
                              >
                                <Plus className="w-3.5 h-3.5" /> Registrar
                              </button>
                            )}
                          </div>
                          <p className={`font-bold text-sm ${item.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(item.netProfit)}
                          </p>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openPaymentModal(item.vehicle.id)} 
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700 transition-all"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pago
                          </button>
                          <button 
                            onClick={() => openExpenseModal(item.vehicle.id)} 
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition-all"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Gasto
                          </button>
                        </div>
                        
                        {/* Expenses List */}
                        {item.expenses.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Gastos registrados:</p>
                            <div className="space-y-1.5 max-h-24 overflow-y-auto">
                              {item.expenses.map((expense) => (
                                <div key={expense.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-700/50 rounded-lg px-2 py-1.5">
                                  <span className="text-gray-600 dark:text-gray-300 truncate flex-1 mr-2 capitalize">{expense.category}</span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-red-600 dark:text-red-400 font-medium">{formatCurrency(expense.amount)}</span>
                                    <button 
                                      onClick={() => handleDeleteExpense(expense.id)} 
                                      className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {vehiclesWithoutDriver.length > 0 && (
                <div>
                  <h2 className="font-heading text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-gray-400" />
                    Vehículos sin Chofer ({vehiclesWithoutDriver.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {vehiclesWithoutDriver.map((item) => (
                      <div key={item.vehicle.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                            <Car className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-700 dark:text-white">{item.vehicle.plate}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.vehicle.brand} {item.vehicle.model}</p>
                          </div>
                        </div>
                        <div className="mt-3 text-center py-2 bg-white dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Sin chofer asignado</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Monthly View Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setReportMonth(m => m === 0 ? 11 : m - 1)} 
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <select 
                  value={reportMonth} 
                  onChange={(e) => setReportMonth(parseInt(e.target.value))} 
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg outline-none border-none"
                >
                  {monthNames.map((m, i) => (<option key={i} value={i}>{m}</option>))}
                </select>
                <select 
                  value={reportYear} 
                  onChange={(e) => setReportYear(parseInt(e.target.value))} 
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg outline-none border-none"
                >
                  {[reportYear - 1, reportYear, reportYear + 1].map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
              </div>
              <button 
                onClick={() => setReportMonth(m => m === 11 ? 0 : m + 1)} 
                className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <span className="text-base font-semibold text-gray-700 dark:text-gray-300 ml-2">
                {monthNames[reportMonth]} {reportYear}
              </span>
            </div>
            
            {/* Export Actions */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Exportar:</span>
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4" />
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-all shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700"><X className="w-5 h-5" /></button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl flex items-center justify-between">
              <span className="text-sm">{success}</span>
              <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700"><X className="w-5 h-5" /></button>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">Cargando...</div>
          ) : !reportData || reportData.vehicles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <Car className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No hay datos para el período seleccionado</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehículo</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Chofer</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pagos</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ingresos</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Ing.</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gastos</th>
                      <th className="text-right px-3 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {reportData.weeklyTotals && reportData.weeklyTotals.map((week: any) => (
                      <tr key={`week-${week.weekNumber}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td colSpan={2} className="px-4 py-3 font-semibold text-gray-900 dark:text-white bg-gray-50/50 dark:bg-gray-800/50 text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            Semana {week.weekNumber}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-green-600 dark:text-green-400 bg-gray-50/50 dark:bg-gray-800/50 text-xs">
                          {formatCurrency(week.totalPayments)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400 bg-gray-50/50 dark:bg-gray-800/50 text-xs">
                          {formatCurrency(week.totalIncome)}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-green-600 dark:text-green-400 bg-gray-50/50 dark:bg-gray-800/50 text-xs">
                          {formatCurrency(week.totalRevenue)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-red-600 dark:text-red-400 bg-gray-50/50 dark:bg-gray-800/50 text-xs">
                          {formatCurrency(week.totalExpenses)}
                        </td>
                        <td className={`px-3 py-3 text-right font-bold bg-gray-50/50 dark:bg-gray-800/50 text-xs ${week.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {formatCurrency(week.netProfit)}
                        </td>
                      </tr>
                    ))}
                    {reportData.vehicles.map((vehicle: any) => (
                      <tr key={vehicle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 dark:bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Car className="w-4 h-4 text-primary dark:text-primary-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{vehicle.plate}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{vehicle.driver || '-'}</td>
                        <td className="px-3 py-3 text-right font-semibold text-green-600 dark:text-green-400">{formatCurrency(vehicle.totalPayments)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(vehicle.totalIncome)}</td>
                        <td className="px-3 py-3 text-right font-bold text-green-600 dark:text-green-400">{formatCurrency(vehicle.totalRevenue)}</td>
                        <td className="px-3 py-3 text-right font-semibold text-red-600 dark:text-red-400">{formatCurrency(vehicle.totalExpenses)}</td>
                        <td className={`px-3 py-3 text-right font-bold ${vehicle.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(vehicle.netProfit)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                    <tr>
                      <td colSpan={2} className="px-4 py-3 text-gray-900 dark:text-white text-xs uppercase tracking-wider">TOTALES</td>
                      <td className="px-3 py-3 text-right text-green-600 dark:text-green-400">{formatCurrency(reportData.grandTotals.totalPayments)}</td>
                      <td className="px-3 py-3 text-right text-emerald-600 dark:text-emerald-400">{formatCurrency(reportData.grandTotals.totalIncome)}</td>
                      <td className="px-3 py-3 text-right text-green-600 dark:text-green-400">{formatCurrency(reportData.grandTotals.totalRevenue)}</td>
                      <td className="px-3 py-3 text-right text-red-600 dark:text-red-400">{formatCurrency(reportData.grandTotals.totalExpenses)}</td>
                      <td className={`px-3 py-3 text-right ${reportData.grandTotals.netProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(reportData.grandTotals.netProfit)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-heading text-lg font-bold dark:text-white">Registrar Pago Semanal</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vehículo</label>
                <input 
                  type="text" 
                  value={vehicles.find(v => v.id === selectedVehicle)?.plate || ''} 
                  disabled 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-300" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chofer</label>
                <select 
                  name="driverId" 
                  required 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Seleccionar...</option>
                  {drivers.filter(d => d.vehicleId === selectedVehicle).map(d => (<option key={d.id} value={d.id}>{d.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Monto</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  placeholder="150000" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha de Pago</label>
                <input 
                  type="date" 
                  name="paymentDate" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPaymentModal(false)} 
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  Guardar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="font-heading text-lg font-bold dark:text-white">Registrar Gasto</h3>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Vehículo</label>
                <input 
                  type="text" 
                  value={vehicles.find(v => v.id === selectedVehicle)?.plate || ''} 
                  disabled 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-300" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Categoría</label>
                <select 
                  name="category" 
                  required 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none capitalize"
                >
                  {EXPENSE_CATEGORIES.map(cat => (<option key={cat.value} value={cat.value} className="capitalize">{cat.label}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <input 
                  type="text" 
                  name="description" 
                  required 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  placeholder="Descripción del gasto" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Monto</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  placeholder="50000" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha del Gasto</label>
                <input 
                  type="date" 
                  name="expense_date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required 
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowExpenseModal(false)} 
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
                >
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
