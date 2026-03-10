import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getWeeksInMonth(year: number, month: number) {
  const weeks: { weekNumber: number; start: Date; end: Date }[] = []
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  let currentWeekStart = new Date(firstDay)
  currentWeekStart.setDate(firstDay.getDate() - firstDay.getDay() + 1)
  
  let weekNumber = 1
  while (currentWeekStart <= lastDay) {
    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(currentWeekStart.getDate() + 6)
    
    if (weekEnd > lastDay) {
      weekEnd.setDate(lastDay.getDate())
    }
    
    weeks.push({
      weekNumber,
      start: new Date(currentWeekStart),
      end: new Date(weekEnd)
    })
    
    currentWeekStart.setDate(currentWeekStart.getDate() + 7)
    weekNumber++
    
    if (weekNumber > 6) break
  }
  
  return weeks
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    return NextResponse.json(
      { error: 'Recurso eliminado' },
      { status: 410 }
    )
  } catch (error: any) {
    console.error('Finance report error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
