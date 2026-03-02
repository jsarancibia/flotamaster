import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth()

    const formData = await request.formData()
    const action = formData.get('_action')

    if (action === 'delete') {
      await prisma.vehicle.delete({
        where: { id: params.id }
      })
      return NextResponse.redirect(new URL('/dashboard/vehicles', request.url))
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error) {
    console.error('Vehicle action error:', error)
    return NextResponse.json(
      { error: 'Error en la acción' },
      { status: 500 }
    )
  }
}
