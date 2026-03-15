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

      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        select: {
          id: true,
          driver: { select: { id: true } },
          _count: {
            select: {
              rentals: true,
              maintenances: true,
              expenses: true,
              incomes: true,
              weeklyPayments: true,
              pagosSemanales: true,
              repuestos: true
            }
          }
        }
      })

      if (!vehicle) {
        return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
      }

      const c = vehicle._count ?? {}
      const rentals = Number(c.rentals ?? 0)
      const maintenances = Number(c.maintenances ?? 0)
      const expenses = Number(c.expenses ?? 0)
      const incomes = Number(c.incomes ?? 0)
      const weeklyPayments = Number(c.weeklyPayments ?? 0)
      const pagosSemanales = Number(c.pagosSemanales ?? 0)
      const repuestos = Number(c.repuestos ?? 0)

      const hasDriver = vehicle.driver != null && typeof (vehicle.driver as { id?: string })?.id === 'string'
      const hasRelations =
        hasDriver ||
        rentals > 0 ||
        maintenances > 0 ||
        expenses > 0 ||
        incomes > 0 ||
        weeklyPayments > 0 ||
        pagosSemanales > 0 ||
        repuestos > 0

      if (hasRelations) {
        return NextResponse.json(
          {
            error:
              'No se puede eliminar el vehículo porque tiene registros asociados (chofer asignado, alquileres, mantenimientos, gastos, ingresos, pagos semanales o repuestos).'
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
