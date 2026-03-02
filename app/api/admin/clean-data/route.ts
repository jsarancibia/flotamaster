import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    await prisma.expense.deleteMany({})
    await prisma.maintenance.deleteMany({})
    await prisma.weeklyPayment.deleteMany({})
    await prisma.income.deleteMany({})
    await prisma.rental.deleteMany({})

    return NextResponse.json({ 
      success: true, 
      message: 'Financial data cleaned successfully. Users and authentication preserved.' 
    })
  } catch (error: any) {
    console.error('Clean data error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
