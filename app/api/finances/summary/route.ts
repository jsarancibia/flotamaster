import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

function getWeekDates(year: number, weekNumber: number) {
  const simple = new Date(year, 0, 1 + (weekNumber - 1) * 7)
  const dow = simple.getDay()
  const weekStart = new Date(simple)
  if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1)
  else weekStart.setDate(simple.getDate() + 8 - simple.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59)
  return { weekStart, weekEnd }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const weekNumber = parseInt(searchParams.get('weekNumber') || getCurrentWeek().toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const { weekStart, weekEnd } = getWeekDates(year, weekNumber)

    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: { select: { id: true, name: true } },
        weeklyPayments: {
          where: { weekNumber, year }
        } as any,
        expenses: {
          where: {
            expenseDate: { gte: weekStart, lte: weekEnd }
          }
        } as any,
        maintenances: {
          where: {
            date: { gte: weekStart, lte: weekEnd },
            status: 'completado'
          }
        } as any
      }
    } as any)

    const summary = vehicles.map((vehicle: any) => {
      const payments = vehicle.weeklyPayments || []
      const expenses = vehicle.expenses || []
      
      const totalPayments = payments.reduce((sum: number, p: any) => sum + p.amount, 0)
      const manualExpenses = expenses.filter((e: any) => !e.maintenanceId).reduce((sum: number, e: any) => sum + e.amount, 0)
      const maintenanceExpenses = expenses.filter((e: any) => e.maintenanceId).reduce((sum: number, e: any) => sum + e.amount, 0)
      const totalExpenses = manualExpenses + maintenanceExpenses
      const totalIncome = vehicle.weeklyRate || 120000
      const netProfit = totalPayments - totalExpenses

      return {
        vehicle: {
          id: vehicle.id,
          plate: vehicle.plate,
          brand: vehicle.brand,
          model: vehicle.model,
          weeklyRate: vehicle.weeklyRate || 120000
        },
        driver: vehicle.driver,
        payments,
        expenses,
        totalPayments,
        manualExpenses,
        maintenanceExpenses,
        totalExpenses,
        totalIncome,
        netProfit,
        paymentStatus: payments[0]?.paid || false,
        paymentId: payments[0]?.id || null,
        expensesByCategory: expenses.reduce((acc: Record<string, number>, e: any) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount
          return acc
        }, {} as Record<string, number>)
      }
    })

    const totals = summary.reduce((acc, v) => ({
      totalPayments: acc.totalPayments + v.totalPayments,
      totalIncome: acc.totalIncome + v.totalIncome,
      manualExpenses: acc.manualExpenses + v.manualExpenses,
      maintenanceExpenses: acc.maintenanceExpenses + v.maintenanceExpenses,
      totalExpenses: acc.totalExpenses + v.totalExpenses,
      netProfit: acc.netProfit + v.netProfit
    }), { totalPayments: 0, totalIncome: 0, manualExpenses: 0, maintenanceExpenses: 0, totalExpenses: 0, netProfit: 0 })

    return NextResponse.json({
      weekNumber,
      year,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      summary,
      totals
    })
  } catch (error: any) {
    console.error('Financial summary error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

function getCurrentWeek() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now.getTime() - start.getTime()
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  return Math.ceil(diff / oneWeek)
}
