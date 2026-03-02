import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || new Date().getMonth().toString())
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59)

    const maintenances = await prisma.maintenance.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      },
      include: {
        vehicle: {
          include: {
            driver: { select: { id: true, name: true, phone: true } }
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    const reportData = maintenances.map((m: any) => ({
      id: m.id,
      vehicle: {
        id: m.vehicle.id,
        plate: m.vehicle.plate,
        brand: m.vehicle.brand,
        model: m.vehicle.model,
        year: m.vehicle.year,
        color: m.vehicle.color,
        type: m.vehicle.type
      },
      driver: m.vehicle.driver,
      type: m.type,
      category: m.category,
      description: m.description,
      cost: m.cost,
      date: m.date,
      status: m.status
    }))

    const totalCost = reportData.reduce((sum, m) => sum + m.cost, 0)
    const byStatus = {
      pending: reportData.filter((m: any) => m.status === 'pendiente').length,
      completed: reportData.filter((m: any) => m.status === 'completado').length
    }
    const byType = {
      preventivo: reportData.filter((m: any) => m.type === 'preventivo').length,
      correctivo: reportData.filter((m: any) => m.type === 'correctivo').length
    }
    const byCategory = reportData.reduce((acc: Record<string, number>, m: any) => {
      acc[m.category] = (acc[m.category] || 0) + m.cost
      return acc
    }, {} as Record<string, number>)

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    return NextResponse.json({
      period: {
        month,
        year,
        monthName: monthNames[month],
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      maintenances: reportData,
      summary: {
        totalCost,
        totalCount: reportData.length,
        byStatus,
        byType,
        byCategory
      }
    })
  } catch (error: any) {
    console.error('Maintenance report error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
