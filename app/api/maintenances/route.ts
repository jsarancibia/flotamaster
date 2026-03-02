import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const { vehicleId, type, category, description, cost } = await request.json()

    if (!vehicleId || !type || !description || cost === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const maintenance = await prisma.maintenance.create({
      data: {
        vehicleId,
        type,
        category,
        description,
        cost: parseFloat(cost),
        status: 'pendiente'
      }
    })

    return NextResponse.json({ success: true, maintenance })
  } catch (error) {
    console.error('Maintenance creation error:', error)
    return NextResponse.json(
      { error: 'Error al crear mantenimiento' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await requireAuth()
    const maintenances = await prisma.maintenance.findMany({
      include: { vehicle: true },
      orderBy: { date: 'desc' }
    })

    const maintenanceVehicles = await prisma.vehicle.findMany({
      where: { status: 'mantenimiento' },
      include: { driver: true },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ maintenances, maintenanceVehicles })
  } catch (error: any) {
    console.error('Maintenance GET error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
