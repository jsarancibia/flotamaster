import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Elimina un vehículo por placa (y todos sus registros asociados).
 * POST body: { "plate": "GX LH 48" }
 * Requiere autenticación.
 */
export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json().catch(() => ({}))
    const plate = typeof body?.plate === 'string' ? body.plate.trim() : ''
    if (!plate) {
      return NextResponse.json({ error: 'Falta el campo "plate" en el body' }, { status: 400 })
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: { plate: { equals: plate, mode: 'insensitive' } },
      select: { id: true, plate: true }
    })

    if (!vehicle) {
      const normalized = plate.replace(/\s+/g, '').toUpperCase()
      const all = await prisma.vehicle.findMany({ select: { id: true, plate: true } })
      const match = all.find((v) => v.plate.replace(/\s+/g, '').toUpperCase() === normalized)
      if (!match) {
        return NextResponse.json({ error: `No se encontró ningún vehículo con la placa: ${plate}` }, { status: 404 })
      }
      await deleteVehicleCascade(match.id)
      return NextResponse.json({ success: true, message: `Vehículo ${match.plate} eliminado.` })
    }

    await deleteVehicleCascade(vehicle.id)
    return NextResponse.json({ success: true, message: `Vehículo ${vehicle.plate} eliminado.` })
  } catch (error: unknown) {
    console.error('Delete vehicle by plate error:', error)
    const err = error as { message?: string }
    if (err?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error al eliminar vehículo' }, { status: 500 })
  }
}

async function deleteVehicleCascade(id: string) {
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
}
