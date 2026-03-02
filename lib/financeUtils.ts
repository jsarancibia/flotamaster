import { prisma } from '@/lib/prisma'

export interface WeekData {
  weekNumber: number
  start: Date
  end: Date
}

export interface FinanceResult {
  weeklyBreakdown: any[]
  totals: {
    totalPayments: number
    totalIncome: number
    totalRevenue: number
    totalExpenses: number
    netProfit: number
  }
}

export async function calculateFinanceForMonth(year: number, month: number): Promise<{
  vehicles: any[]
  weeklyTotals: any[]
  grandTotals: any
  weeks: any[]
}> {
  const weeks = getWeeksInMonth(year, month)
  
  const startDate = new Date(year, month, 1)
  const endDate = new Date(year, month + 1, 0, 23, 59, 59)

  const vehicles = await prisma.vehicle.findMany({
    include: {
      driver: { select: { id: true, name: true, phone: true, license: true } },
      weeklyPayments: {
        where: { year },
        orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }]
      },
      expenses: {
        orderBy: { date: 'desc' }
      },
      incomes: {
        orderBy: { date: 'desc' }
      },
      maintenances: {
        orderBy: { date: 'desc' }
      }
    }
  })

  const reportData = vehicles.map((vehicle: any) => {
    const allPayments = (vehicle.weeklyPayments || [])
    const allExpenses = (vehicle.expenses || [])
    const allIncomes = (vehicle.incomes || [])
    const allMaintenances = (vehicle.maintenances || [])

    const weeklyBreakdown = weeks.map(week => {
      const weekStart = new Date(week.start)
      const weekEnd = new Date(week.end)
      weekStart.setHours(0, 0, 0, 0)
      weekEnd.setHours(23, 59, 59, 999)

      const weekPayments = allPayments.filter((p: any) => {
        const payDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.weekStart)
        return payDate >= weekStart && payDate <= weekEnd
      })

      const weekIncomes = allIncomes.filter((i: any) => {
        const incomeDate = new Date(i.date)
        return incomeDate >= weekStart && incomeDate <= weekEnd
      })

      const weekExpenses = allExpenses.filter((e: any) => {
        const expenseDate = new Date(e.date)
        return expenseDate >= weekStart && expenseDate <= weekEnd
      })

      const weekMaintenanceCosts = allMaintenances
        .filter((m: any) => {
          const maintDate = new Date(m.date)
          return maintDate >= weekStart && maintDate <= weekEnd
        })
        .reduce((sum: number, m: any) => sum + Number(m.cost || 0), 0)

      const totalPayments = weekPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
      const totalIncome = weekIncomes.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0)
      const totalRevenue = totalPayments + totalIncome
      const totalExpenses = weekExpenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) + weekMaintenanceCosts
      const netProfit = totalRevenue - totalExpenses

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

    const paymentsInMonth = allPayments.filter((p: any) => {
      const payDate = p.paymentDate ? new Date(p.paymentDate) : new Date(p.weekStart)
      return payDate >= startDate && payDate <= endDate
    })

    const expensesInMonth = allExpenses.filter((e: any) => {
      const expenseDate = new Date(e.date)
      return expenseDate >= startDate && expenseDate <= endDate
    })

    const maintenanceCostsInMonth = allMaintenances
      .filter((m: any) => {
        const maintDate = new Date(m.date)
        return maintDate >= startDate && maintDate <= endDate
      })
      .reduce((sum: number, m: any) => sum + Number(m.cost || 0), 0)

    const incomesInMonth = allIncomes.filter((i: any) => {
      const incomeDate = new Date(i.date)
      return incomeDate >= startDate && incomeDate <= endDate
    })

    const totalPayments = paymentsInMonth.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
    const totalIncome = incomesInMonth.reduce((sum: number, i: any) => sum + Number(i.amount || 0), 0)
    const totalRevenue = totalPayments + totalIncome
    const totalExpenses = expensesInMonth.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0) + maintenanceCostsInMonth
    const netProfit = totalRevenue - totalExpenses

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
      totalPayments,
      totalIncome,
      totalRevenue,
      totalExpenses,
      netProfit
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
    return {
      weekNumber: week.weekNumber,
      startDate: week.start.toISOString(),
      endDate: week.end.toISOString(),
      totalPayments: weekData.reduce((sum: number, w: any) => sum + w.totals.totalPayments, 0),
      totalIncome: weekData.reduce((sum: number, w: any) => sum + w.totals.totalIncome, 0),
      totalRevenue: weekData.reduce((sum: number, w: any) => sum + w.totals.totalRevenue, 0),
      totalExpenses: weekData.reduce((sum: number, w: any) => sum + w.totals.totalExpenses, 0),
      netProfit: weekData.reduce((sum: number, w: any) => sum + w.totals.netProfit, 0)
    }
  })

  return {
    vehicles: reportData,
    weeklyTotals,
    grandTotals,
    weeks: weeks.map(w => ({ weekNumber: w.weekNumber, start: w.start.toISOString(), end: w.end.toISOString() }))
  }
}

function getWeeksInMonth(year: number, month: number): WeekData[] {
  const weeks: WeekData[] = []
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
