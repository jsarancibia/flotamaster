import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function parseFechaCompra(input: unknown) {
  if (!input) return new Date()
  const s = String(input)
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(s)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2])
    const d = Number(m[3])
    const dt = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0))
    return dt
  }
  return new Date(s)
}

export async function GET() {
  try {
    await requireAuth()

    const repuestos = await prisma.repuesto.findMany({
      include: { vehiculo: { select: { id: true, plate: true, brand: true, model: true } } },
      orderBy: { fechaCompra: 'desc' },
    })

    return NextResponse.json({ repuestos })
  } catch (error: any) {
    console.error('Repuestos GET error:', error)
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const vehiculoId = (body?.vehiculoId as string | undefined) || ''
    const nombre = (body?.nombre as string | undefined)?.trim() || ''
    const descripcion = (body?.descripcion as string | undefined)?.trim() || null
    const proveedor = (body?.proveedor as string | undefined)?.trim() || null

    const cantidadRaw = body?.cantidadComprada ?? body?.cantidad
    const precioUnitarioRaw = body?.precioUnitario
    const fechaCompraRaw = body?.fechaCompra

    const cantidadComprada = Number.parseInt(String(cantidadRaw ?? ''), 10)
    const precioUnitario = Number.parseFloat(String(precioUnitarioRaw ?? ''))

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    if (!Number.isFinite(cantidadComprada) || cantidadComprada <= 0) {
      return NextResponse.json({ error: 'La cantidad es obligatoria y debe ser mayor a 0' }, { status: 400 })
    }

    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      return NextResponse.json({ error: 'El precio unitario es obligatorio y debe ser válido' }, { status: 400 })
    }

    const fechaCompra = parseFechaCompra(fechaCompraRaw)
    if (Number.isNaN(fechaCompra.getTime())) {
      return NextResponse.json({ error: 'Fecha de compra inválida' }, { status: 400 })
    }

    const repuesto = await prisma.repuesto.create({
      data: {
        vehiculoId: (vehiculoId || null) as any,
        nombre,
        descripcion,
        cantidadComprada,
        cantidadActual: cantidadComprada,
        precioUnitario,
        proveedor,
        fechaCompra,
      },
      include: { vehiculo: { select: { id: true, plate: true, brand: true, model: true } } },
    })

    return NextResponse.json({ success: true, repuesto })
  } catch (error: any) {
    console.error('Repuestos POST error:', error)
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const id = (body?.id as string | undefined) || ''

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const existing = await prisma.repuesto.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 })
    }

    const vehiculoId = (body?.vehiculoId as string | undefined) || ''
    const nombre = (body?.nombre as string | undefined)?.trim() || ''
    const descripcion = (body?.descripcion as string | undefined)?.trim() || null
    const proveedor = (body?.proveedor as string | undefined)?.trim() || null

    const cantidadRaw = body?.cantidadComprada ?? body?.cantidad
    const precioUnitarioRaw = body?.precioUnitario
    const fechaCompraRaw = body?.fechaCompra

    const cantidadComprada = Number.parseInt(String(cantidadRaw ?? ''), 10)
    const precioUnitario = Number.parseFloat(String(precioUnitarioRaw ?? ''))

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    if (!Number.isFinite(cantidadComprada) || cantidadComprada <= 0) {
      return NextResponse.json({ error: 'La cantidad es obligatoria y debe ser mayor a 0' }, { status: 400 })
    }

    if (!Number.isFinite(precioUnitario) || precioUnitario < 0) {
      return NextResponse.json({ error: 'El precio unitario es obligatorio y debe ser válido' }, { status: 400 })
    }

    const fechaCompra = parseFechaCompra(fechaCompraRaw)
    if (Number.isNaN(fechaCompra.getTime())) {
      return NextResponse.json({ error: 'Fecha de compra inválida' }, { status: 400 })
    }

    const usados = existing.cantidadComprada - existing.cantidadActual
    const nuevaCantidadActual = Math.max(0, cantidadComprada - usados)

    const repuesto = await prisma.repuesto.update({
      where: { id },
      data: {
        vehiculoId: (vehiculoId || null) as any,
        nombre,
        descripcion,
        cantidadComprada,
        cantidadActual: nuevaCantidadActual,
        precioUnitario,
        proveedor,
        fechaCompra,
      },
      include: { vehiculo: { select: { id: true, plate: true, brand: true, model: true } } },
    })

    return NextResponse.json({ success: true, repuesto })
  } catch (error: any) {
    console.error('Repuestos PUT error:', error)
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth()

    const body = await request.json()
    const id = (body?.id as string | undefined) || ''
    const cantidadUsar = Number.parseInt(String(body?.cantidadUsar ?? ''), 10)

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    if (!Number.isFinite(cantidadUsar) || cantidadUsar <= 0) {
      return NextResponse.json({ error: 'La cantidad a usar debe ser mayor a 0' }, { status: 400 })
    }

    const existing = await prisma.repuesto.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Repuesto no encontrado' }, { status: 404 })
    }

    if (cantidadUsar > existing.cantidadActual) {
      return NextResponse.json({ error: `Stock insuficiente. Disponible: ${existing.cantidadActual}` }, { status: 400 })
    }

    const repuesto = await prisma.repuesto.update({
      where: { id },
      data: {
        cantidadActual: existing.cantidadActual - cantidadUsar,
      },
      include: { vehiculo: { select: { id: true, plate: true, brand: true, model: true } } },
    })

    return NextResponse.json({ success: true, repuesto })
  } catch (error: any) {
    console.error('Repuestos PATCH error:', error)
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      try {
        const body = await request.json()
        id = body?.id || null
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    await prisma.repuesto.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Repuestos DELETE error:', error)
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
