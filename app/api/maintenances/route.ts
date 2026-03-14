import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface RepuestoUsado {
  id: string
  cantidad: number
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const { vehicleId, type, category, description, cost, repuestosUsados } = body

    if (!vehicleId || !type || !description || cost === undefined) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    const items: RepuestoUsado[] = Array.isArray(repuestosUsados)
      ? repuestosUsados.filter((r: any) => r?.id && Number.isFinite(Number(r?.cantidad)) && Number(r.cantidad) > 0)
          .map((r: any) => ({ id: String(r.id), cantidad: Math.floor(Number(r.cantidad)) }))
      : []

    if (items.length > 0) {
      const repuestos = await prisma.repuesto.findMany({
        where: { id: { in: items.map(i => i.id) } },
        select: { id: true, nombre: true, cantidadActual: true },
      })

      const byId = new Map(repuestos.map(r => [r.id, r]))

      for (const item of items) {
        const rep = byId.get(item.id)
        if (!rep) {
          return NextResponse.json({ error: `Repuesto no encontrado: ${item.id}` }, { status: 400 })
        }
        if (item.cantidad > rep.cantidadActual) {
          return NextResponse.json(
            { error: `Stock insuficiente para "${rep.nombre}". Disponible: ${rep.cantidadActual}, solicitado: ${item.cantidad}` },
            { status: 400 }
          )
        }
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const maintenance = await tx.maintenance.create({
        data: {
          vehicleId,
          type,
          category,
          description,
          cost: parseFloat(cost),
          status: 'pendiente',
        },
      })

      for (const item of items) {
        await tx.repuesto.update({
          where: { id: item.id },
          data: { cantidadActual: { decrement: item.cantidad } },
        })
      }

      return maintenance
    })

    return NextResponse.json({ success: true, maintenance: result })
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
