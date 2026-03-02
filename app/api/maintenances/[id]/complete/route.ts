import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const maintenance = await prisma.maintenance.findUnique({
      where: { id: params.id },
      include: { vehicle: true }
    })

    if (!maintenance) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 })
    }

    const updatedMaintenance = await prisma.maintenance.update({
      where: { id: params.id },
      data: { status: 'completado' }
    })

    if (maintenance.cost > 0) {
      await prisma.expense.create({
        data: {
          vehicleId: maintenance.vehicleId,
          category: 'mantenimiento',
          description: `Mantenimiento ${maintenance.type} - ${maintenance.category}: ${maintenance.description}`,
          amount: maintenance.cost,
          date: new Date()
        } as any
      })
    }

    return NextResponse.json({ success: true, maintenance: updatedMaintenance })
  } catch (error) {
    console.error('Complete maintenance error:', error)
    return NextResponse.json(
      { error: 'Error al completar mantenimiento' },
      { status: 500 }
    )
  }
}
