import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const result = await prisma.$transaction(async (tx) => {
      const expenses = await tx.expense.deleteMany({})
      const pagos = await tx.pagoSemanal.deleteMany({})
      const weeklyPayments = await tx.weeklyPayment.deleteMany({})
      const incomes = await tx.income.deleteMany({})
      const rentals = await tx.rental.deleteMany({})
      const repuestos = await tx.repuesto.deleteMany({})
      const maintenances = await tx.maintenance.deleteMany({})
      const drivers = await tx.driver.deleteMany({})
      const vehicles = await tx.vehicle.deleteMany({})

      return {
        expenses: expenses.count,
        pagos: pagos.count,
        weeklyPayments: weeklyPayments.count,
        incomes: incomes.count,
        rentals: rentals.count,
        repuestos: repuestos.count,
        maintenances: maintenances.count,
        drivers: drivers.count,
        vehicles: vehicles.count,
      }
    })

    const total = Object.values(result).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      success: true,
      message: `Base de datos limpia. ${total} registros eliminados.`,
      detalle: result,
    })
  } catch (error: any) {
    console.error('Clean data error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
