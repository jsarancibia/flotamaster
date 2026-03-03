import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getWeekDates(year: number, weekNumber: number) {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7)
  const dow = simple.getDay()
  const weekStart = new Date(simple)
  if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else weekStart.setDate(simple.getDate() + 8 - simple.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  return { weekStart, weekEnd }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const { vehicleId, category, description, amount, expenseDate, weekNumber, year } = await request.json()

    if (!vehicleId || !category || !description || amount === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    let parsedExpenseDate = new Date()
    if (expenseDate) {
      parsedExpenseDate = new Date(expenseDate)
    } else if (weekNumber && year) {
      const { weekStart } = getWeekDates(year, weekNumber)
      parsedExpenseDate = weekStart
    }

    const expense = await prisma.expense.create({
      data: {
        vehicleId,
        description,
        category,
        amount: parseFloat(amount),
        date: parsedExpenseDate,
        expenseDate: parsedExpenseDate
      }
    })

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Expense creation error:', error)
    return NextResponse.json(
      { error: 'Error al registrar gasto' },
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
    const category = searchParams.get('category')

    const where: any = {}
    if (vehicleId) where.vehicleId = vehicleId
    if (category) where.category = category

    let expenses = await prisma.expense.findMany({
      where,
      include: {
        vehicle: { select: { id: true, plate: true, brand: true, model: true } }
      },
      orderBy: { date: 'desc' }
    })

    if (weekNumber && year) {
      const startDate = new Date(parseInt(year), 0, 1 + (parseInt(weekNumber) - 1) * 7)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 7)
      
      expenses = expenses.filter(e => {
        const expenseDate = new Date(e.date)
        return expenseDate >= startDate && expenseDate < endDate
      })
    }

    return NextResponse.json({ expenses })
  } catch (error: any) {
    console.error('Expense GET error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth()

    const { id, category, description, amount } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const expense = await prisma.expense.update({
      where: { id },
      data: {
        ...(category && { category }),
        ...(description && { description }),
        ...(amount !== undefined && { amount: parseFloat(amount) })
      }
    })

    return NextResponse.json({ success: true, expense })
  } catch (error) {
    console.error('Expense update error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar gasto' },
      { status: 500 }
    )
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

    await prisma.expense.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Expense delete error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    )
  }
}
