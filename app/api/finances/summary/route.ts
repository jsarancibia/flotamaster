import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseDateOrNull(value: unknown) {
  if (!value || typeof value !== 'string') return null
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(value)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const da = Number(m[3])
    if (!y || !mo || !da) return null
    return new Date(y, mo - 1, da, 12, 0, 0, 0)
  }
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d
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

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const selectedDateParam = parseDateOrNull(searchParams.get('fechaSeleccionada'))
    const weekStartParam = parseDateOrNull(searchParams.get('semanaInicio'))
    const weekEndParam = parseDateOrNull(searchParams.get('semanaFin'))

    const now = new Date()
    const { weekStart, weekEnd } = weekStartParam && weekEndParam
      ? { weekStart: weekStartParam, weekEnd: weekEndParam }
      : getWeekRangeFor(now)

    const monthRef = selectedDateParam || weekStartParam || now
    const monthStart = new Date(monthRef.getFullYear(), monthRef.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)
    const monthEnd = new Date(monthRef.getFullYear(), monthRef.getMonth() + 1, 0)
    monthEnd.setHours(23, 59, 59, 999)

    const [pagosSemana, pagosMes] = await Promise.all([
      (prisma as any).pagoSemanal.findMany({
        where: {
          semanaInicio: weekStart,
          semanaFin: weekEnd
        },
        include: {
          vehiculo: { select: { id: true, weeklyRate: true } }
        }
      }),
      (prisma as any).pagoSemanal.findMany({
        where: {
          fechaPago: { gte: monthStart, lte: monthEnd }
        }
      })
    ])

    const totalSemana = pagosSemana.reduce((sum: number, p: any) => sum + (Number(p.monto) || 0), 0)
    const totalMes = pagosMes.reduce((sum: number, p: any) => sum + (Number(p.monto) || 0), 0)

    const groups = new Map<string, { conductorId: string; total: number; cuota: number }>()
    for (const p of pagosSemana) {
      const cuota = Number(p?.vehiculo?.weeklyRate) || 0
      const key = `${p.conductorId}::${p.vehiculoId}`
      const current = groups.get(key)
      if (!current) {
        groups.set(key, { conductorId: p.conductorId, total: Number(p.monto) || 0, cuota })
      } else {
        current.total += Number(p.monto) || 0
        current.cuota = current.cuota || cuota
      }
    }

    let pagosPendientes = 0
    const conductoresPagadosSet = new Set<string>()

    for (const g of Array.from(groups.values())) {
      if (g.total <= 0) {
        pagosPendientes += 1
        continue
      }
      if (g.cuota > 0 && g.total >= g.cuota) {
        conductoresPagadosSet.add(g.conductorId)
      }
    }

    const conductoresPagados = conductoresPagadosSet.size

    return NextResponse.json({
      semanaInicio: weekStart.toISOString(),
      semanaFin: weekEnd.toISOString(),
      totalRecaudadoSemana: totalSemana,
      totalRecaudadoMes: totalMes,
      pagosPendientes,
      conductoresPagados
    })
  } catch (error: any) {
    console.error('Financial summary error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
