import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const formData = await request.formData()
    const action = formData.get('_action')

    if (action === 'delete') {
      const id = params.id

      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
        include: {
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

      const hasDriver = !!vehicle.driver
      const hasRelations =
        hasDriver ||
        vehicle._count.rentals > 0 ||
        vehicle._count.maintenances > 0 ||
        vehicle._count.expenses > 0 ||
        vehicle._count.incomes > 0 ||
        vehicle._count.weeklyPayments > 0 ||
        vehicle._count.pagosSemanales > 0 ||
        vehicle._count.repuestos > 0

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
