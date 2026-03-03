import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getWeeksInMonth(year: number, month: number) {
  const weeks: { weekNumber: number; start: Date; end: Date }[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  let currentWeekStart = new Date(firstDay)
  currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay() + 1)
  
  let weekNumber = 1
  while (currentWeekStart <= lastDay) {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(currentWeekStart.getDate() + 6)
    
    if (weekEnd > lastDay) {
      weekEnd.setDate(lastDay.getDate())
    }
    
    weeks.push({
      weekNumber,
      start: new Date(currentWeekStart),
      end: new Date(weekEnd)
    })
    
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    weekNumber++
    
    if (weekNumber > 6) break
  }
  
  return weeks
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    console.log("=== MONTHLY REPORT API ===")
    console.log("month:", month, "year:", year)

    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59)
    const weeks = getWeeksInMonth(year, month)

    console.log("startDate:", startDate.toISOString())
    console.log("endDate:", endDate.toISOString())
    console.log("weeks:", weeks.map(w => ({ week: w.weekNumber, start: w.start.toISOString(), end: w.end.toISOString() })))

    const vehicles = await prisma.vehicle.findMany({
      include: {
        driver: { select: { id: true, name: true, phone: true, license: true } },
        weeklyPayments: {
          where: {
            year,
            paymentDate: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }]
        },
        expenses: {
          where: { 
            expenseDate: { gte: startDate, lte: endDate }
          },
          orderBy: { expenseDate: 'desc' }
        },
        incomes: {
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: 'desc' }
        },
        maintenances: {
          where: { date: { gte: startDate, lte: endDate } },
          orderBy: { date: 'desc' }
        }
      }
    })

    const reportData = vehicles.map((vehicle: any) => {
      const allPayments = (vehicle.weeklyPayments || []).map((p: any) => ({ ...p, amount: Number(p.amount) || 0 }))
      const allExpenses = (vehicle.expenses || []).map((e: any) => ({ ...e, amount: Number(e.amount) || 0 }))
      const allIncomes = (vehicle.incomes || []).map((i: any) => ({ ...i, amount: Number(i.amount) || 0 }))
      const allMaintenances = (vehicle.maintenances || []).map((m: any) => ({ ...m, cost: Number(m.cost) || 0 }))

      const weeklyBreakdown = weeks.map(week => {
        const weekStartStr = week.start.toISOString().split('T')[0]
        const weekEndStr = week.end.toISOString().split('T')[0]

        const weekPayments = allPayments.filter((p: any) => {
          const payDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.weekStart)
          const payDateStr = payDate.toISOString().split('T')[0]
          return payDateStr >= weekStartStr && payDateStr <= weekEndStr
        })

        const weekIncomes = allIncomes.filter((i: any) => {
          const incomeDate = new Date(i.date)
          const incomeDateStr = incomeDate.toISOString().split('T')[0]
          return incomeDateStr >= weekStartStr && incomeDateStr <= weekEndStr
        })

        const weekExpenses = allExpenses.filter((e: any) => {
          const expenseDate = e.expenseDate ? new Date(e.expenseDate) : new Date(e.date)
          const expenseDateStr = expenseDate.toISOString().split('T')[0]
          return expenseDateStr >= weekStartStr && expenseDateStr <= weekEndStr
        })

        const weekMaintenanceCosts = allMaintenances
          .filter((m: any) => {
            const maintDate = new Date(m.date)
            const maintDateStr = maintDate.toISOString().split('T')[0]
            return maintDateStr >= weekStartStr && maintDateStr <= weekEndStr
          })
          .reduce((sum: number, m: any) => sum + m.cost, 0)

        const totalPayments = weekPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
        const totalIncome = weekIncomes.reduce((sum: number, i: any) => sum + i.amount, 0)
        const totalRevenue = totalPayments + totalIncome
        const totalExpenses = weekExpenses.reduce((sum: number, e: any) => sum + e.amount, 0) + weekMaintenanceCosts
        const netProfit = totalRevenue - totalExpenses

        console.log(`Week ${week.weekNumber}: payments=${totalPayments}, expenses=${weekExpenses.reduce((s: number, e: any) => s + e.amount, 0)}, net=${netProfit}`)

        return {
          weekNumber: week.weekNumber,
          startDate: week.start.toISOString(),
          endDate: week.end.toISOString(),
          payments: weekPayments,
          incomes: weekIncomes,
          expenses: weekExpenses,
          maintenanceCosts: weekMaintenanceCosts,
          totals: {
            totalPayments,
            totalIncome,
            totalRevenue,
            totalExpenses,
            netProfit
          }
        }
      })

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      const paymentsInMonth = allPayments.filter((p: any) => {
        const payDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.weekStart)
        const payDateStr = payDate.toISOString().split('T')[0]
        return payDateStr >= startDateStr && payDateStr <= endDateStr
      })

      const expensesInMonth = allExpenses.filter((e: any) => {
        const expenseDate = e.expenseDate ? new Date(e.expenseDate) : new Date(e.date)
        const expenseDateStr = expenseDate.toISOString().split('T')[0]
        return expenseDateStr >= startDateStr && expenseDateStr <= endDateStr
      })

      const maintenanceCostsInMonth = allMaintenances
        .filter((m: any) => {
          const maintDate = new Date(m.date)
          const maintDateStr = maintDate.toISOString().split('T')[0]
          return maintDateStr >= startDateStr && maintDateStr <= endDateStr
        })
        .reduce((sum: number, m: any) => sum + m.cost, 0)

      const incomesInMonth = allIncomes.filter((i: any) => {
        const incomeDate = new Date(i.date)
        const incomeDateStr = incomeDate.toISOString().split('T')[0]
        return incomeDateStr >= startDateStr && incomeDateStr <= endDateStr
      })

      const monthlyTotalPayments = paymentsInMonth.reduce((sum: number, p: any) => sum + p.amount, 0)
      const monthlyTotalIncome = incomesInMonth.reduce((sum: number, i: any) => sum + i.amount, 0)
      const monthlyTotalRevenue = monthlyTotalPayments + monthlyTotalIncome
      const monthlyTotalExpenses = expensesInMonth.reduce((sum: number, e: any) => sum + e.amount, 0) + maintenanceCostsInMonth
      const monthlyNetProfit = monthlyTotalRevenue - monthlyTotalExpenses

      return {
        id: vehicle.id,
        plate: vehicle.plate,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.color,
        type: vehicle.type,
        weeklyRate: vehicle.weeklyRate || 120000,
        driver: vehicle.driver?.name || null,
        weeklyBreakdown,
        totalPayments: monthlyTotalPayments,
        totalIncome: monthlyTotalIncome,
        totalRevenue: monthlyTotalRevenue,
        totalExpenses: monthlyTotalExpenses,
        netProfit: monthlyNetProfit
      }
    })

    const grandTotals = reportData.reduce((acc, v) => ({
      totalPayments: acc.totalPayments + v.totalPayments,
      totalIncome: acc.totalIncome + v.totalIncome,
      totalRevenue: acc.totalRevenue + v.totalRevenue,
      totalExpenses: acc.totalExpenses + v.totalExpenses,
      netProfit: acc.netProfit + v.netProfit
    }), { totalPayments: 0, totalIncome: 0, totalRevenue: 0, totalExpenses: 0, netProfit: 0 })

    const weeklyTotals = weeks.map((week, idx) => {
      const weekData = reportData.map((v: any) => v.weeklyBreakdown[idx]).filter(Boolean)
      
      const tp = weekData.reduce((sum: number, w: any) => sum + w.totals.totalPayments, 0)
      const ti = weekData.reduce((sum: number, w: any) => sum + w.totals.totalIncome, 0)
      const tr = weekData.reduce((sum: number, w: any) => sum + w.totals.totalRevenue, 0)
      const te = weekData.reduce((sum: number, w: any) => sum + w.totals.totalExpenses, 0)
      const np = weekData.reduce((sum: number, w: any) => sum + w.totals.netProfit, 0)
      
      console.log(`Week ${week.weekNumber} totals: payments=${tp}, income=${ti}, revenue=${tr}, expenses=${te}, net=${np}`)
      
      return {
        weekNumber: week.weekNumber,
        startDate: week.start.toISOString(),
        endDate: week.end.toISOString(),
        totalPayments: tp,
        totalIncome: ti,
        totalRevenue: tr,
        totalExpenses: te,
        netProfit: np
      }
    })

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    return NextResponse.json({
      period: {
        month,
        year,
        monthName: monthNames[month],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      weeks: weeks.map(w => ({ weekNumber: w.weekNumber, start: w.start.toISOString(), end: w.end.toISOString() })),
      vehicles: reportData,
      grandTotals,
      weeklyTotals
    })
  } catch (error: any) {
    console.error('Finance report error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
