import { NextRequest, NextResponse } from 'next/server'
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
    return NextResponse.json(
      { error: 'Recurso eliminado' },
      { status: 410 }
    )
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
    return NextResponse.json(
      { error: 'Recurso eliminado' },
      { status: 410 }
    )
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
    return NextResponse.json(
      { error: 'Recurso eliminado' },
      { status: 410 }
    )
  } catch (error) {
    console.error('Weekly payment delete error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar pago' },
      { status: 500 }
    )
  }
}
