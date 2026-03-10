import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const seedToken = process.env.SEED_ADMIN_TOKEN?.trim() || ''
    if (!seedToken) {
      return NextResponse.json(
        { error: 'Missing SEED_ADMIN_TOKEN' },
        { status: 500 }
      )
    }

    const providedToken = request.headers.get('x-seed-token')?.trim() || ''
    if (!providedToken || providedToken !== seedToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const email = process.env.SEED_ADMIN_EMAIL?.trim() || ''
    const password = process.env.SEED_ADMIN_PASSWORD?.trim() || ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD' },
        { status: 500 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: {
        email,
        password: hashedPassword,
        name: 'Administrador'
      }
    })

    return NextResponse.json({ 
      message: 'Admin user created',
      email: user.email 
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Seed failed' },
      { status: 500 }
    )
  }
}
