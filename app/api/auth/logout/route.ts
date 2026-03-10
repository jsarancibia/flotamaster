import { NextRequest, NextResponse } from 'next/server'
import { destroySession } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  try {
    await destroySession()

    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl, { status: 303 })
  } catch (error) {
    console.error('Logout error:', error)

    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('error', 'logout')
    return NextResponse.redirect(redirectUrl, { status: 303 })
  }
}
