import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST() {
  try {
    const email = process.env.SEED_ADMIN_EMAIL?.trim() || ''
    const password = process.env.SEED_ADMIN_PASSWORD?.trim() || ''

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD' },
        { status: 500 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      await prisma.user.delete({ where: { email } })
    }

    const hashedPassword = '$2a$10$330.XUaCHl9MvE4D0zGF7ewcXeMHjS.v8CqWE1kssYnECs7MbKSvG'

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
