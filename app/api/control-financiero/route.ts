import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseIntOrNull(value: string | null) {
  if (!value) return null
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

function monthRange(year: number, month1to12: number) {
  const start = new Date(year, month1to12 - 1, 1, 0, 0, 0, 0)
  const end = new Date(year, month1to12, 1, 0, 0, 0, 0)
  return { start, end }
}

function yearRange(year: number) {
  const start = new Date(year, 0, 1, 0, 0, 0, 0)
  const end = new Date(year + 1, 0, 1, 0, 0, 0, 0)
  return { start, end }
}

function monthLabel(i0to11: number) {
  const mm = String(i0to11 + 1).padStart(2, '0')
  return mm
}

function repuestoCostoTotal(r: { cantidadComprada?: unknown; cantidad?: unknown; precioUnitario: unknown }) {
  const cantidad = Number(r.cantidadComprada ?? r.cantidad) || 0
  const precioUnitario = Number(r.precioUnitario) || 0
  return cantidad * precioUnitario
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const month = parseIntOrNull(searchParams.get('mes'))
    const year = parseIntOrNull(searchParams.get('anio'))
    const vehiculoId = searchParams.get('vehiculoId') || null

    const now = new Date()
    const y = year ?? now.getFullYear()

    const range = month ? monthRange(y, month) : yearRange(y)

    const ingresoWhere: any = {
      fechaPago: {
        gte: range.start,
        lt: range.end,
      },
    }

    const gastoWhere: any = {
      date: {
        gte: range.start,
        lt: range.end,
      },
    }

    const repuestoWhere: any = {
      fechaCompra: {
        gte: range.start,
        lt: range.end,
      },
    }

    if (vehiculoId) {
      ingresoWhere.vehiculoId = vehiculoId
      gastoWhere.vehicleId = vehiculoId
      repuestoWhere.vehiculoId = vehiculoId
    }

    const [pagos, mantenimientos, repuestos] = await Promise.all([
      prisma.pagoSemanal.findMany({
        where: ingresoWhere,
        include: {
          conductor: { select: { id: true, name: true } },
          vehiculo: { select: { id: true, plate: true } },
        },
        orderBy: { fechaPago: 'desc' },
      }),
      prisma.maintenance.findMany({
        where: gastoWhere,
        include: { vehicle: { select: { id: true, plate: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.repuesto.findMany({
        where: repuestoWhere,
        include: { vehiculo: { select: { id: true, plate: true } } },
        orderBy: { fechaCompra: 'desc' },
      }),
    ])

    const ingresosPeriodo = pagos.reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0)
    const gastosMantenimientos = mantenimientos.reduce((acc: number, m: any) => acc + (Number(m.cost) || 0), 0)
    const gastosRepuestos = repuestos.reduce((acc: number, r: any) => acc + repuestoCostoTotal(r), 0)
    const gastosPeriodo = gastosMantenimientos + gastosRepuestos
    const gananciaNeta = ingresosPeriodo - gastosPeriodo

    const movimientos = [
      ...pagos.map((p: any) => ({
        fecha: p.fechaPago,
        tipo: 'Ingreso' as const,
        vehiculo: p.vehiculo?.plate ?? '',
        descripcion: p.observaciones || `Pago semanal${p.conductor?.name ? ` - ${p.conductor.name}` : ''}`,
        monto: Number(p.monto) || 0,
      })),
      ...mantenimientos.map((m: any) => ({
        fecha: m.date,
        tipo: 'Gasto' as const,
        vehiculo: m.vehicle?.plate ?? '',
        descripcion: m.description,
        monto: Number(m.cost) || 0,
      })),
      ...repuestos.map((r: any) => ({
        fecha: r.fechaCompra,
        tipo: 'Gasto' as const,
        vehiculo: r.vehiculo?.plate ?? 'General',
        descripcion: r.descripcion || `Repuesto: ${r.nombre}`,
        monto: repuestoCostoTotal(r),
      })),
    ].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

    let ingresosPorMes: Array<{ mes: string; ingresos: number }>
    let ingresosVsGastos: Array<{ mes: string; ingresos: number; gastos: number }>

    if (month) {
      const ingresosMes = pagos.reduce((acc: number, p: any) => acc + (Number(p.monto) || 0), 0)
      const gastosMes =
        mantenimientos.reduce((acc: number, m: any) => acc + (Number(m.cost) || 0), 0) +
        repuestos.reduce((acc: number, r: any) => acc + repuestoCostoTotal(r), 0)
      ingresosPorMes = Array.from({ length: 12 }, (_, i) => ({
        mes: monthLabel(i),
        ingresos: 0,
      }))

      ingresosVsGastos = Array.from({ length: 12 }, (_, i) => ({
        mes: monthLabel(i),
        ingresos: 0,
        gastos: 0,
      }))

      const idx = month - 1
      if (idx >= 0 && idx < 12) {
        ingresosPorMes[idx].ingresos = ingresosMes
        ingresosVsGastos[idx].ingresos = ingresosMes
        ingresosVsGastos[idx].gastos = gastosMes
      }
    } else {
      const yearR = yearRange(y)

      const [pagosYear, mantenimientosYear, repuestosYear] = await Promise.all([
        prisma.pagoSemanal.findMany({
          where: {
            fechaPago: { gte: yearR.start, lt: yearR.end },
            ...(vehiculoId ? { vehiculoId } : {}),
          },
          select: { fechaPago: true, monto: true },
        }),
        prisma.maintenance.findMany({
          where: {
            date: { gte: yearR.start, lt: yearR.end },
            ...(vehiculoId ? { vehicleId: vehiculoId } : {}),
          },
          select: { date: true, cost: true },
        }),
        prisma.repuesto.findMany({
          where: {
            fechaCompra: { gte: yearR.start, lt: yearR.end },
            ...(vehiculoId ? { vehiculoId } : {}),
          },
          select: { fechaCompra: true, cantidadComprada: true, precioUnitario: true },
        }),
      ])

      ingresosPorMes = Array.from({ length: 12 }, (_, i) => ({
        mes: monthLabel(i),
        ingresos: 0,
      }))

      for (const p of pagosYear) {
        const d = new Date(p.fechaPago)
        if (d.getFullYear() !== y) continue
        const idx = d.getMonth()
        ingresosPorMes[idx].ingresos += Number(p.monto) || 0
      }

      ingresosVsGastos = Array.from({ length: 12 }, (_, i) => ({
        mes: monthLabel(i),
        ingresos: 0,
        gastos: 0,
      }))

      for (const p of pagosYear) {
        const d = new Date(p.fechaPago)
        if (d.getFullYear() !== y) continue
        const idx = d.getMonth()
        ingresosVsGastos[idx].ingresos += Number(p.monto) || 0
      }

      for (const m of mantenimientosYear) {
        const d = new Date(m.date)
        if (d.getFullYear() !== y) continue
        const idx = d.getMonth()
        ingresosVsGastos[idx].gastos += Number(m.cost) || 0
      }

      for (const r of repuestosYear) {
        const d = new Date(r.fechaCompra)
        if (d.getFullYear() !== y) continue
        const idx = d.getMonth()
        ingresosVsGastos[idx].gastos += repuestoCostoTotal({
          cantidadComprada: Number(r.cantidadComprada) || 0,
          precioUnitario: Number(r.precioUnitario) || 0,
        })
      }
    }

    const gastosPorVehiculoMap = new Map<string, number>()
    for (const m of mantenimientos) {
      const plate = m.vehicle?.plate ?? 'Sin vehículo'
      gastosPorVehiculoMap.set(plate, (gastosPorVehiculoMap.get(plate) ?? 0) + (Number(m.cost) || 0))
    }

    for (const r of repuestos) {
      const plate = r.vehiculo?.plate ?? 'General'
      gastosPorVehiculoMap.set(plate, (gastosPorVehiculoMap.get(plate) ?? 0) + repuestoCostoTotal(r))
    }

    const gastosPorVehiculo = Array.from(gastosPorVehiculoMap.entries()).map(([vehiculo, gastos]) => ({
      vehiculo,
      gastos,
    }))

    return NextResponse.json({
      filtros: { mes: month, anio: y, vehiculoId },
      resumen: {
        ingresosPeriodo,
        gastosPeriodo,
        gananciaNeta,
      },
      graficos: {
        ingresosPorMes,
        gastosPorVehiculo,
        ingresosVsGastos,
      },
      movimientos,
    })
  } catch (error: any) {
    console.error('Control Financiero GET error:', error)
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
