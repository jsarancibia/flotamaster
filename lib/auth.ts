import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const AUTH_COOKIE = 'flotamaster_auth'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  })
}

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get(AUTH_COOKIE)?.value

    if (!userId) return null

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    return user
  } catch (error) {
    console.error('getSession error:', error)
    return null
  }
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete({ name: AUTH_COOKIE, path: '/' })
}

export async function requireAuth() {
  const user = await getSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
