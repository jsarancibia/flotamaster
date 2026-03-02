import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const { plate, type, brand, model, year, color, driverId, weeklyRate } = await request.json()

    if (!plate || !type || !brand || !model || !year) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const existing = await prisma.vehicle.findUnique({ where: { plate } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un vehículo con esta placa' },
        { status: 400 }
      )
    }

    if (driverId) {
      const driverWithVehicle = await prisma.driver.findFirst({
        where: { id: driverId, vehicleId: { not: null } }
      })
      if (driverWithVehicle) {
        return NextResponse.json(
          { error: 'El chofer ya tiene un vehículo asignado' },
          { status: 400 }
        )
      }
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plate,
        type,
        brand,
        model,
        year: parseInt(year),
        color,
        weeklyRate: weeklyRate ? parseFloat(weeklyRate) : 120000,
        driver: driverId ? { connect: { id: driverId } } : undefined
      } as any
    })

    return NextResponse.json({ success: true, vehicle })
  } catch (error: any) {
    console.error('Vehicle creation error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Error al crear vehículo' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await requireAuth()
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        driver: true,
        _count: {
          select: { maintenances: true, expenses: true, incomes: true }
        }
      }
    })
    return NextResponse.json({ vehicles })
  } catch (error: any) {
    console.error('Vehicle GET error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth()

    const { id, plate, type, brand, model, year, color, status, driverId, weeklyRate } = await request.json()

    if (!id || !plate || !type || !brand || !model || !year) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const existing = await prisma.vehicle.findFirst({
      where: { plate, NOT: { id } }
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un vehículo con esta placa' },
        { status: 400 }
      )
    }

    if (driverId) {
      const driverWithVehicle = await prisma.driver.findFirst({
        where: { id: driverId, vehicleId: { not: null }, NOT: { vehicleId: id } }
      })
      if (driverWithVehicle) {
        return NextResponse.json(
          { error: 'El chofer ya tiene un vehículo asignado' },
          { status: 400 }
        )
      }
    }

    const currentVehicle = await prisma.vehicle.findUnique({ where: { id } } as any)
    if (!currentVehicle) {
      return NextResponse.json({ error: 'Vehículo no encontrado' }, { status: 404 })
    }

    const previousDriverId = (currentVehicle as any).driverId

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        plate,
        type,
        brand,
        model,
        year: parseInt(year),
        color,
        status: status || 'disponible',
        weeklyRate: weeklyRate ? parseFloat(weeklyRate) : 120000,
        driver: driverId 
          ? { connect: { id: driverId } } 
          : driverId === null 
            ? { disconnect: true }
            : undefined
      } as any
    })

    if (previousDriverId && previousDriverId !== driverId) {
      await prisma.driver.update({
        where: { id: previousDriverId },
        data: { vehicleId: null }
      })
    }

    const newStatus = status || 'disponible'
    const previousStatus = currentVehicle.status

    if (newStatus === 'mantenimiento' && previousStatus !== 'mantenimiento') {
      await prisma.maintenance.create({
        data: {
          vehicleId: id,
          type: 'preventivo',
          category: 'revision',
          description: 'Vehículo enviado a mantenimiento desde gestión de flota',
          cost: 0,
          status: 'pendiente'
        }
      })
    }

    if (previousStatus === 'mantenimiento' && newStatus !== 'mantenimiento') {
      await prisma.maintenance.updateMany({
        where: {
          vehicleId: id,
          status: 'pendiente'
        },
        data: {
          status: 'completado'
        }
      })
    }

    return NextResponse.json({ success: true, vehicle })
  } catch (error: any) {
    console.error('Vehicle update error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Error al actualizar vehículo' },
      { status: 500 }
    )
  }
}
