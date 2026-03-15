import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Limpieza completa de datos operativos para entrega final.
 * Orden de eliminación respetando FKs: tablas hijas primero.
 * NO toca la tabla User (autenticación se mantiene intacta).
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const usersBefore = await prisma.user.count()

    const result = await prisma.$transaction(async (tx) => {
      // 1. Expense (referencia a Maintenance y Vehicle) — primero para poder borrar Maintenance
      const expenses = await tx.expense.deleteMany({})
      // 2. Maintenance (referencia a Vehicle)
      const maintenances = await tx.maintenance.deleteMany({})
      // 3. Tablas que referencian Vehicle y Driver
      const rentals = await tx.rental.deleteMany({})
      const weeklyPayments = await tx.weeklyPayment.deleteMany({})
      const pagosSemanales = await tx.pagoSemanal.deleteMany({})
      // 4. Income y Repuesto (referencia a Vehicle)
      const incomes = await tx.income.deleteMany({})
      const repuestos = await tx.repuesto.deleteMany({})
      // 5. Driver (referencia opcional a Vehicle) — antes de Vehicle
      const drivers = await tx.driver.deleteMany({})
      // 6. Vehicle — último
      const vehicles = await tx.vehicle.deleteMany({})

      return {
        expenses: expenses.count,
        maintenances: maintenances.count,
        rentals: rentals.count,
        weeklyPayments: weeklyPayments.count,
        pagosSemanales: pagosSemanales.count,
        incomes: incomes.count,
        repuestos: repuestos.count,
        drivers: drivers.count,
        vehicles: vehicles.count,
      }
    })

    const usersAfter = await prisma.user.count()
    const totalDeleted = Object.values(result).reduce((a, b) => a + b, 0)

    const verification = await Promise.all([
      prisma.expense.count(),
      prisma.maintenance.count(),
      prisma.rental.count(),
      prisma.weeklyPayment.count(),
      prisma.pagoSemanal.count(),
      prisma.income.count(),
      prisma.repuesto.count(),
      prisma.driver.count(),
      prisma.vehicle.count(),
    ])

    const allZero = verification.every((c) => c === 0)

    return NextResponse.json({
      success: true,
      message: `Limpieza completada. ${totalDeleted} registros eliminados. Usuarios preservados: ${usersAfter}.`,
      detalle: result,
      verificacion: {
        registrosRestantes: {
          gastos: verification[0],
          mantenimientos: verification[1],
          alquileres: verification[2],
          weeklyPayments: verification[3],
          pagosSemanales: verification[4],
          ingresos: verification[5],
          repuestos: verification[6],
          choferes: verification[7],
          vehiculos: verification[8],
        },
        tablasOperativasVacias: allZero,
        usuariosAntes: usersBefore,
        usuariosDespues: usersAfter,
      },
    })
  } catch (error: unknown) {
    console.error('Clean data error:', error)
    const err = error as { message?: string }
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno al limpiar datos' }, { status: 500 })
  }
}
