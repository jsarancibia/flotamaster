import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST() {
  try {
    await destroySession()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}
