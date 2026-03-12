import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateDMY = (date: string | Date) => {
  const d = new Date(date)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${dd}-${mm}-${yyyy}`
}

export function exportFinanceReportPDF(data: any) {
  const doc = new jsPDF()
  const { period, weeks, vehicles, grandTotals, weeklyTotals } = data

  doc.setFontSize(18)
  doc.text('Reporte Financiero de Flota', 14, 20)
  
  doc.setFontSize(12)
  doc.text(`Período: ${period.monthName} ${period.year}`, 14, 30)
  doc.text(`Fecha de generación: ${formatDate(new Date())}`, 14, 36)

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumen Semanal', 14, 48)
  
  const weeklyTableData = weeklyTotals.map((w: any) => [
    `Semana ${w.weekNumber}`,
    formatDate(w.startDate) + ' - ' + formatDate(w.endDate),
    formatCurrency(w.totalPayments),
    formatCurrency(w.totalIncome),
    formatCurrency(w.totalRevenue),
    formatCurrency(w.totalExpenses),
    formatCurrency(w.netProfit)
  ])

  autoTable(doc, {
    startY: 52,
    head: [['Semana', 'Fechas', 'Pagos', 'Ingresos', 'Total Ing.', 'Gastos', 'Neto']],
    body: weeklyTableData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 }
  })

  let yPos = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(12)
  doc.text(`TOTALES DEL MES: Ingresos: ${formatCurrency(grandTotals.totalRevenue)} | Gastos: ${formatCurrency(grandTotals.totalExpenses)} | Neto: ${formatCurrency(grandTotals.netProfit)}`, 14, yPos)
  yPos += 10

  vehicles.forEach((vehicleData: any) => {
    const { plate, brand, model, driver, weeklyBreakdown, totalPayments, totalIncome, totalRevenue, totalExpenses, netProfit } = vehicleData

    if (yPos > 250) {
      doc.addPage()
      yPos = 20
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Vehículo: ${plate} - ${brand} ${model}`, 14, yPos)
    yPos += 5

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Chofer: ${driver || 'Sin asignar'} | Neto: ${formatCurrency(netProfit)}`, 14, yPos)
    yPos += 3

    const vehicleWeeklyData = weeklyBreakdown.map((w: any) => [
      `Semana ${w.weekNumber}`,
      formatCurrency(w.totals.totalPayments),
      formatCurrency(w.totals.totalIncome),
      formatCurrency(w.totals.totalRevenue),
      formatCurrency(w.totals.totalExpenses),
      formatCurrency(w.totals.netProfit)
    ])

    if (vehicleWeeklyData.length > 0) {
      autoTable(doc, {
        startY: yPos,
        head: [['Semana', 'Pagos', 'Ingresos', 'Total Ing.', 'Gastos', 'Neto']],
        body: vehicleWeeklyData,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139] },
        styles: { fontSize: 8 },
        margin: { left: 14 },
        tableWidth: 'wrap'
      })
      yPos = (doc as any).lastAutoTable.finalY + 8
    }
  })

  doc.save(`reporte-financiero-${period.monthName.toLowerCase()}-${period.year}.pdf`)
}

export function exportFinanceReportExcel(data: any) {
  const { period, weeks, vehicles, grandTotals, weeklyTotals } = data
  const wb = XLSX.utils.book_new()

  const weeklySummaryData = weeklyTotals.map((w: any) => ({
    'Semana': w.weekNumber,
    'Fecha Inicio': formatDate(w.startDate),
    'Fecha Fin': formatDate(w.endDate),
    'Pagos': w.totalPayments,
    'Ingresos': w.totalIncome,
    'Total Ingresos': w.totalRevenue,
    'Gastos': w.totalExpenses,
    'Neto': w.netProfit
  }))

  const wsWeekly = XLSX.utils.json_to_sheet(weeklySummaryData)
  XLSX.utils.book_append_sheet(wb, wsWeekly, 'Resumen Semanal')

  const summaryData = vehicles.map((v: any) => ({
    'Placa': v.plate,
    'Vehículo': `${v.brand} ${v.model}`,
    'Chofer': v.driver || 'Sin asignar',
    'Pagos': v.totalPayments,
    'Ingresos': v.totalIncome,
    'Total Ingresos': v.totalRevenue,
    'Gastos': v.totalExpenses,
    'Neto': v.netProfit
  }))

  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Vehículos')

  const vehicleWeeklyRows: any[] = []
  vehicles.forEach((v: any) => {
    v.weeklyBreakdown.forEach((w: any) => {
      vehicleWeeklyRows.push({
        'Placa': v.plate,
        'Chofer': v.driver || 'N/A',
        'Semana': w.weekNumber,
        'Pagos': w.totals.totalPayments,
        'Ingresos': w.totals.totalIncome,
        'Total Ingresos': w.totals.totalRevenue,
        'Gastos': w.totals.totalExpenses,
        'Neto': w.totals.netProfit
      })
    })
  })

  if (vehicleWeeklyRows.length > 0) {
    const wsVehicleWeekly = XLSX.utils.json_to_sheet(vehicleWeeklyRows)
    XLSX.utils.book_append_sheet(wb, wsVehicleWeekly, 'Detalle Semanal')
  }

  const totalsData = [
    { 'Concepto': 'Total Pagos', 'Monto': grandTotals.totalPayments },
    { 'Concepto': 'Total Ingresos', 'Monto': grandTotals.totalIncome },
    { 'Concepto': 'Total Ingresos Mes', 'Monto': grandTotals.totalRevenue },
    { 'Concepto': 'Total Gastos', 'Monto': grandTotals.totalExpenses },
    { 'Concepto': 'Ganancia Neta', 'Monto': grandTotals.netProfit }
  ]
  const wsTotals = XLSX.utils.json_to_sheet(totalsData)
  XLSX.utils.book_append_sheet(wb, wsTotals, 'Totales')

  XLSX.writeFile(wb, `reporte-financiero-${period.monthName.toLowerCase()}-${period.year}.xlsx`)
}

export function exportMaintenanceReportPDF(data: any) {
  const doc = new jsPDF()
  const { period, maintenances, summary } = data

  doc.setFontSize(18)
  doc.text('Reporte de Mantenimiento de Flota', 14, 20)
  
  doc.setFontSize(12)
  doc.text(`Período: ${period.monthName} ${period.year}`, 14, 30)
  doc.text(`Fecha de generación: ${formatDate(new Date())}`, 14, 36)

  doc.setFontSize(12)
  doc.text(`Total Mantenimientos: ${summary.totalCount} | Costo Total: ${formatCurrency(summary.totalCost)}`, 14, 46)
  doc.text(`Pendientes: ${summary.byStatus.pending} | Completados: ${summary.byStatus.completed}`, 14, 52)

  const tableData = maintenances.map((m: any) => [
    m.vehicle.plate,
    `${m.vehicle.brand} ${m.vehicle.model}`,
    m.driver?.name || 'Sin asignar',
    m.type,
    m.category,
    m.description.substring(0, 25),
    formatCurrency(m.cost),
    formatDate(m.date),
    m.status === 'completado' ? 'Completado' : 'Pendiente'
  ])

  autoTable(doc, {
    startY: 60,
    head: [['Placa', 'Vehículo', 'Chofer', 'Tipo', 'Categoría', 'Descripción', 'Costo', 'Fecha', 'Estado']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [249, 115, 22] },
    styles: { fontSize: 8 },
    columnStyles: { 6: { halign: 'right' } }
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  doc.setFontSize(12)
  doc.text('Resumen por Categoría:', 14, finalY)

  const categoryData = Object.entries(summary.byCategory).map(([cat, cost]) => [cat, formatCurrency(cost as number)])
  
  autoTable(doc, {
    startY: finalY + 2,
    head: [['Categoría', 'Costo Total']],
    body: categoryData,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    margin: { left: 14, right: 100 }
  })

  doc.save(`reporte-mantenimiento-${period.monthName.toLowerCase()}-${period.year}.pdf`)
}

export function exportMaintenanceReportExcel(data: any) {
  const { period, maintenances, summary } = data
  const wb = XLSX.utils.book_new()

  const mainData = maintenances.map((m: any) => ({
    'Placa': m.vehicle.plate,
    'Vehículo': `${m.vehicle.brand} ${m.vehicle.model}`,
    'Año': m.vehicle.year,
    'Chofer': m.driver?.name || 'Sin asignar',
    'Teléfono': m.driver?.phone || 'N/A',
    'Tipo': m.type,
    'Categoría': m.category,
    'Descripción': m.description,
    'Costo': m.cost,
    'Fecha': formatDate(m.date),
    'Estado': m.status === 'completado' ? 'Completado' : 'Pendiente'
  }))

  const wsMain = XLSX.utils.json_to_sheet(mainData)
  XLSX.utils.book_append_sheet(wb, wsMain, 'Mantenimientos')

  const summaryData = [
    { 'Concepto': 'Total Mantenimientos', 'Valor': summary.totalCount },
    { 'Concepto': 'Costo Total', 'Valor': summary.totalCost },
    { 'Concepto': 'Pendientes', 'Valor': summary.byStatus.pending },
    { 'Concepto': 'Completados', 'Valor': summary.byStatus.completed },
    { 'Concepto': 'Preventivos', 'Valor': summary.byType.preventivo },
    { 'Concepto': 'Correctivos', 'Valor': summary.byType.correctivo }
  ]
  
  Object.entries(summary.byCategory).forEach(([cat, cost]) => {
    summaryData.push({ 'Concepto': `Categoría: ${cat}`, 'Valor': cost })
  })

  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen')

  XLSX.writeFile(wb, `reporte-mantenimiento-${period.monthName.toLowerCase()}-${period.year}.xlsx`)
}

export function exportFinanzasResumenPDF(input: {
  pagos: Array<{
    conductor: string
    vehiculo: string
    semana: string
    fechaPago?: string
    tipoPago?: string
    monto: number
    estado: string
  }>
  totalRecaudado: number
  semanaInicio: string
  semanaFin: string
}) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Resumen Financiero BlasRodríguez', 14, 20)

  doc.setFontSize(12)
  doc.text(`Semana: ${formatDate(input.semanaInicio)} - ${formatDate(input.semanaFin)}`, 14, 30)
  doc.text(`Fecha de generación: ${formatDate(new Date())}`, 14, 36)

  const rows = input.pagos.map((p) => {
    return [
      p.conductor,
      p.vehiculo,
      p.semana,
      p.fechaPago ? formatDate(p.fechaPago) : '',
      p.tipoPago === 'completo' ? 'Pago completo' : 'Abono',
      formatCurrency(p.monto),
      p.estado
    ]
  })

  autoTable(doc, {
    startY: 44,
    head: [['Conductor', 'Vehículo', 'Semana', 'Fecha pago', 'Tipo', 'Monto', 'Estado']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
    columnStyles: { 5: { halign: 'right' } }
  })

  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 60
  doc.setFontSize(12)
  doc.text(`Total recaudado: ${formatCurrency(input.totalRecaudado)}`, 14, finalY)

  doc.save('resumen-financiero-blasrodriguez.pdf')
}

export function exportReporteFinancieroSemanalPDF(input: {
  pagos: Array<{
    conductor: string
    vehiculo: string
    fechaPago: string
    tipoPago: 'abono' | 'completo' | string
    monto: number
    semanaInicio: string
    semanaFin: string
  }>
  semanaInicio: string
  semanaFin: string
  totalPagado: number
  totalAbonos: number
  totalCompletos: number
}) {
  const doc = new jsPDF()

  doc.setFontSize(18)
  doc.text('Reporte financiero semanal', 14, 20)

  doc.setFontSize(12)
  doc.text(`Semana: ${formatDateDMY(input.semanaInicio)} al ${formatDateDMY(input.semanaFin)}`, 14, 30)

  const rows = input.pagos.map((p) => {
    return [
      p.conductor,
      p.vehiculo,
      formatDateDMY(p.fechaPago),
      p.tipoPago === 'completo' ? 'Pago completo' : 'Abono',
      formatCurrency(p.monto)
    ]
  })

  autoTable(doc, {
    startY: 40,
    head: [['Conductor', 'Vehículo', 'Fecha', 'Tipo', 'Monto']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
    columnStyles: { 4: { halign: 'right' } }
  })

  const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 60

  doc.setFontSize(12)
  doc.text(`Total pagado: ${formatCurrency(input.totalPagado)}`, 14, finalY)
  doc.text(`Total de abonos: ${formatCurrency(input.totalAbonos)}`, 14, finalY + 6)
  doc.text(`Total de pagos completos: ${formatCurrency(input.totalCompletos)}`, 14, finalY + 12)

  doc.save('reporte-financiero-semanal.pdf')
}

export function exportReporteFinancieroSemanalExcel(input: {
  pagos: Array<{
    conductor: string
    vehiculo: string
    fechaPago: string
    tipoPago: 'abono' | 'completo' | string
    monto: number
    semanaInicio: string
    semanaFin: string
  }>
  totalPagado: number
}) {
  const wb = XLSX.utils.book_new()

  const rows = input.pagos.map((p) => ({
    'Conductor': p.conductor,
    'Vehículo': p.vehiculo,
    'Fecha Pago': formatDateDMY(p.fechaPago),
    'Tipo Pago': p.tipoPago === 'completo' ? 'Pago completo' : 'Abono',
    'Monto': p.monto,
    'Semana Inicio': formatDateDMY(p.semanaInicio),
    'Semana Fin': formatDateDMY(p.semanaFin)
  }))

  rows.push({
    'Conductor': '',
    'Vehículo': '',
    'Fecha Pago': '',
    'Tipo Pago': 'TOTAL',
    'Monto': input.totalPagado,
    'Semana Inicio': '',
    'Semana Fin': ''
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, 'Reporte semanal')

  XLSX.writeFile(wb, 'reporte-financiero-semanal.xlsx')
}
