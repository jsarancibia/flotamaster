import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAuth()

    const formData = await request.formData()
    const action = formData.get('_action')

    if (action === 'delete') {
      const params = await Promise.resolve(context.params)
      const id = params?.id
      if (!id || typeof id !== 'string') {
        return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
      }

      const exists = await prisma.vehicle.findUnique({
        where: { id },
        select: { id: true }
      })
      if (!exists) {
        return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
      }

      const force = formData.get('_force') === '1' || formData.get('_force') === 'true'

      if (force) {
        await prisma.$transaction(async (tx) => {
          const maintIds = await tx.maintenance.findMany({ where: { vehicleId: id }, select: { id: true } }).then((r) => r.map((m) => m.id))
          await tx.expense.deleteMany({
            where: { OR: [{ vehicleId: id }, { maintenanceId: { in: maintIds } }] }
          })
          await tx.maintenance.deleteMany({ where: { vehicleId: id } })
          await tx.rental.deleteMany({ where: { vehicleId: id } })
          await tx.weeklyPayment.deleteMany({ where: { vehicleId: id } })
          await tx.pagoSemanal.deleteMany({ where: { vehiculoId: id } })
          await tx.income.deleteMany({ where: { vehicleId: id } })
          await tx.repuesto.updateMany({ where: { vehiculoId: id }, data: { vehiculoId: null } })
          await tx.driver.updateMany({ where: { vehicleId: id }, data: { vehicleId: null } })
          await tx.vehicle.delete({ where: { id } })
        })
        return NextResponse.json({ success: true })
      }

      const [
        driversCount,
        rentalsCount,
        maintenancesCount,
        expensesCount,
        incomesCount,
        weeklyPaymentsCount,
        pagosSemanalesCount,
        repuestosCount
      ] = await Promise.all([
        prisma.driver.count({ where: { vehicleId: id } }),
        prisma.rental.count({ where: { vehicleId: id } }),
        prisma.maintenance.count({ where: { vehicleId: id } }),
        prisma.expense.count({ where: { vehicleId: id } }),
        prisma.income.count({ where: { vehicleId: id } }),
        prisma.weeklyPayment.count({ where: { vehicleId: id } }),
        prisma.pagoSemanal.count({ where: { vehiculoId: id } }),
        prisma.repuesto.count({ where: { vehiculoId: id } })
      ])

      const hasRelations =
        driversCount > 0 ||
        rentalsCount > 0 ||
        maintenancesCount > 0 ||
        expensesCount > 0 ||
        incomesCount > 0 ||
        weeklyPaymentsCount > 0 ||
        pagosSemanalesCount > 0 ||
        repuestosCount > 0

      if (hasRelations) {
        const relations = []
        if (driversCount > 0) relations.push('chofer asignado')
        if (rentalsCount > 0) relations.push('alquileres')
        if (maintenancesCount > 0) relations.push('mantenimientos')
        if (expensesCount > 0) relations.push('gastos')
        if (incomesCount > 0) relations.push('ingresos')
        if (weeklyPaymentsCount > 0) relations.push('pagos semanales')
        if (pagosSemanalesCount > 0) relations.push('pagos semanales (tabla alternativa)')
        if (repuestosCount > 0) relations.push('repuestos')

        return NextResponse.json(
          {
            error: `No se puede eliminar el vehículo porque tiene: ${relations.join(', ')}.`,
            forceDeleteAvailable: true
          },
          { status: 400 }
        )
      }

      await prisma.vehicle.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: unknown) {
    console.error('Vehicle action error:', error)
    const prismaError = error as { code?: string }
    if (prismaError?.code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar porque tiene registros asociados.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Error en la acción' },
      { status: 500 }
    )
  }
}
