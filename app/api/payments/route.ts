import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getWeekDates(year: number, weekNumber: number) {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7)
  const dow = simple.getDay()
  const weekStart = simple
  if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else weekStart.setDate(simple.getDate() + 8 - simple.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return { weekStart, weekEnd }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const { vehicleId, driverId, amount, weekNumber, year, paid, paymentDate } = await request.json()

    if (!vehicleId || !weekNumber || !year) {
      return NextResponse.json(
        { error: 'Vehicle, week and year are required' },
        { status: 400 }
      )
    }

    const { weekStart, weekEnd } = getWeekDates(year, weekNumber)

    const existing = await (prisma as any).weeklyPayment.findFirst({
      where: { vehicleId, weekNumber, year }
    })

    if (existing) {
      const payment = await (prisma as any).weeklyPayment.update({
        where: { id: existing.id },
        data: {
          ...(driverId && { driverId }),
          ...(amount !== undefined && { amount }),
          ...(paid !== undefined && { 
            paid, 
            paidDate: paid ? (paymentDate ? new Date(paymentDate) : new Date()) : null 
          }),
          ...(paymentDate && { paymentDate: new Date(paymentDate) })
        }
      })
      return NextResponse.json({ success: true, payment })
    }

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver is required for new payment' },
        { status: 400 }
      )
    }

    const payment = await (prisma as any).weeklyPayment.create({
      data: {
        vehicleId,
        driverId,
        amount: amount || 0,
        weekNumber,
        year,
        weekStart,
        weekEnd,
        paid: paid || false,
        paidDate: paid ? (paymentDate ? new Date(paymentDate) : new Date()) : null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date()
      }
    })

    return NextResponse.json({ success: true, payment })
  } catch (error) {
    console.error('Weekly payment error:', error)
    return NextResponse.json(
      { error: 'Error al registrar pago' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const weekNumber = searchParams.get('weekNumber')
    const year = searchParams.get('year')
    const vehicleId = searchParams.get('vehicleId')

    const where: any = {}
    if (weekNumber) where.weekNumber = parseInt(weekNumber)
    if (year) where.year = parseInt(year)
    if (vehicleId) where.vehicleId = vehicleId

    const payments = await (prisma as any).weeklyPayment.findMany({
      where,
      include: {
        vehicle: { select: { id: true, plate: true, brand: true, model: true } },
        driver: { select: { id: true, name: true } }
      },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }]
    })

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error('Weekly payment GET error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
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

    await (prisma as any).weeklyPayment.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Weekly payment delete error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pago' },
      { status: 500 }
    )
  }
}
