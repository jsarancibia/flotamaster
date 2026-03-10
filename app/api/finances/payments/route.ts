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

function getWeekRange(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0 Sunday
  const diffToMonday = (day + 6) % 7
  const monday = new Date(d)
  monday.setDate(d.getDate() - diffToMonday)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { semanaInicio: monday, semanaFin: sunday }
}

function normalizeTipoPago(value: unknown) {
  if (!value) return 'abono'
  if (typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  if (v === 'abono' || v === 'completo') return v
  return null
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const conductorId = body.conductorId as string | undefined
    const vehiculoId = body.vehiculoId as string | undefined
    const fechaPago = parseDateOrNull(body.fechaPago) || parseDateOrNull(body.fechaSeleccionada)
    const semanaInicioRaw = parseDateOrNull(body.semanaInicio)
    const monto = body.monto
    const tipoPago = normalizeTipoPago(body.tipoPago)
    const estado = body.estado as string | undefined
    const observaciones = (body.observaciones as string | undefined) || null

    const fechaBase = fechaPago || semanaInicioRaw
    if (!conductorId || !vehiculoId || !fechaBase || monto === undefined || monto === null) {
      return NextResponse.json({ error: 'Todos los campos requeridos deben estar completos' }, { status: 400 })
    }

    if (!tipoPago) {
      return NextResponse.json({ error: 'Tipo de pago inválido' }, { status: 400 })
    }

    const { semanaInicio, semanaFin } = getWeekRange(fechaBase)

    const montoNum = typeof monto === 'string' ? Number(monto) : monto
    if (typeof montoNum !== 'number' || Number.isNaN(montoNum) || montoNum < 0) {
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
    }

    const estadoFinal = estado && typeof estado === 'string' ? estado : 'Abono'
    if (estadoFinal.length > 30) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    const pago = await (prisma as any).pagoSemanal.create({
      data: {
        conductorId,
        vehiculoId,
        fechaPago: fechaBase,
        tipoPago,
        semanaInicio,
        semanaFin,
        monto: montoNum,
        estado: estadoFinal,
        observaciones
      }
    })

    return NextResponse.json({ success: true, pago })
  } catch (error: any) {
    console.error('Finances payment POST error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error al registrar pago' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const conductorId = searchParams.get('conductorId')
    const vehiculoId = searchParams.get('vehiculoId')
    const fechaSeleccionada = parseDateOrNull(searchParams.get('fechaSeleccionada'))
    const semanaInicio = parseDateOrNull(searchParams.get('semanaInicio'))
    const semanaFin = parseDateOrNull(searchParams.get('semanaFin'))

    const where: any = {}
    if (conductorId) where.conductorId = conductorId
    if (vehiculoId) where.vehiculoId = vehiculoId

    if (fechaSeleccionada) {
      const range = getWeekRange(fechaSeleccionada)
      where.semanaInicio = range.semanaInicio
      where.semanaFin = range.semanaFin
    } else if (semanaInicio && semanaFin) {
      const range = getWeekRange(semanaInicio)
      where.semanaInicio = range.semanaInicio
      where.semanaFin = range.semanaFin
    }

    const pagos = await (prisma as any).pagoSemanal.findMany({
      where,
      include: {
        conductor: { select: { id: true, name: true } },
        vehiculo: { select: { id: true, plate: true, brand: true, model: true, weeklyRate: true } }
      },
      orderBy: { fechaPago: 'desc' }
    })

    return NextResponse.json({ pagos })
  } catch (error: any) {
    console.error('Finances payment GET error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const id = body.id as string | undefined
    const monto = body.monto
    const tipoPago = body.tipoPago !== undefined ? normalizeTipoPago(body.tipoPago) : undefined
    const fechaPago = body.fechaPago !== undefined
      ? (parseDateOrNull(body.fechaPago) || parseDateOrNull(body.fechaSeleccionada))
      : undefined
    const observaciones = body.observaciones !== undefined
      ? ((body.observaciones as string | null) || null)
      : undefined

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const data: any = {}

    if (monto !== undefined && monto !== null) {
      const montoNum = typeof monto === 'string' ? Number(monto) : monto
      if (typeof montoNum !== 'number' || Number.isNaN(montoNum) || montoNum < 0) {
        return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
      }
      data.monto = montoNum
    }

    if (tipoPago !== undefined) {
      if (!tipoPago) return NextResponse.json({ error: 'Tipo de pago inválido' }, { status: 400 })
      data.tipoPago = tipoPago
    }

    if (fechaPago !== undefined) {
      if (!fechaPago) return NextResponse.json({ error: 'Fecha de pago inválida' }, { status: 400 })
      const range = getWeekRange(fechaPago)
      data.fechaPago = fechaPago
      data.semanaInicio = range.semanaInicio
      data.semanaFin = range.semanaFin
    }

    if (observaciones !== undefined) {
      data.observaciones = observaciones
    }

    const pago = await (prisma as any).pagoSemanal.update({
      where: { id },
      data,
      include: {
        conductor: { select: { id: true, name: true } },
        vehiculo: { select: { id: true, plate: true, brand: true, model: true, weeklyRate: true } }
      }
    })

    return NextResponse.json({ success: true, pago })
  } catch (error: any) {
    console.error('Finances payment PATCH error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error al actualizar pago' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await (prisma as any).pagoSemanal.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Finances payment DELETE error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error al eliminar pago' }, { status: 500 })
  }
}
