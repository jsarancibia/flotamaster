import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await requireAuth()

    const params = await Promise.resolve(context.params)
    const id = params?.id
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 })
    }

    const maintenance = await prisma.maintenance.findUnique({
      where: { id },
      select: { id: true }
    })

    if (!maintenance) {
      return NextResponse.json({ error: 'Mantenimiento no encontrado' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.expense.deleteMany({
        where: { maintenanceId: id }
      })
      await tx.maintenance.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Maintenance delete error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar mantenimiento' },
      { status: 500 }
    )
  }
}
