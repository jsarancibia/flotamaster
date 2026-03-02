import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const { name, phone, license } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const driver = await prisma.driver.create({
      data: { name, phone, license }
    })

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error('Driver creation error:', error)
    return NextResponse.json(
      { error: 'Error al crear chofer' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    await requireAuth()
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: 'desc' },
      include: { vehicle: { select: { id: true, plate: true } } }
    })
    return NextResponse.json({ drivers })
  } catch (error: any) {
    console.error('Driver GET error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth()

    const { id, name, phone, license } = await request.json()

    if (!id || !name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const existing = await prisma.driver.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Chofer no encontrado' },
        { status: 404 }
      )
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: { name, phone, license }
    })

    return NextResponse.json({ success: true, driver })
  } catch (error) {
    console.error('Driver update error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar chofer' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      )
    }

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: { vehicle: true, rentals: true }
    })

    if (!driver) {
      return NextResponse.json(
        { error: 'Chofer no encontrado' },
        { status: 404 }
      )
    }

    if (driver.vehicle || driver.rentals.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar: el chofer tiene vehículo o rentals asociados' },
        { status: 400 }
      )
    }

    await prisma.driver.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Driver delete error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar chofer' },
      { status: 500 }
    )
  }
}
