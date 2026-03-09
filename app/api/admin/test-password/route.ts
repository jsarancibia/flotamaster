import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    const user = await prisma.user.findFirst({
      where: { email: { contains: 'flotamaster' } }
    })

    if (!user) {
      return NextResponse.json({ error: 'No user found' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    
    return NextResponse.json({
      email: user.email,
      passwordHash: user.password,
      isValid,
      hashStartsWith: user.password.substring(0, 7)
    })
  } catch (error) {
    console.error('Test error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
