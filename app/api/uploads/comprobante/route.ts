import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth'

export const runtime = 'nodejs'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

function extFromMime(mime: string) {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/png') return 'png'
  if (mime === 'image/webp') return 'webp'
  return null
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()

    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'comprobantes'

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Supabase no configurado (faltan variables de entorno)' },
        { status: 500 }
      )
    }

    const form = await request.formData()
    const file = form.get('file')

    if (!file) {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })
    }

    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: 'Formato no permitido. Solo JPG, PNG o WEBP.' },
        { status: 400 }
      )
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'Archivo demasiado grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    const ext = extFromMime(file.type)
    if (!ext) {
      return NextResponse.json({ error: 'Formato no permitido' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const path = `pagos/${Date.now()}-${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Error al subir comprobante' }, { status: 500 })
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)

    if (!data?.publicUrl) {
      return NextResponse.json({ error: 'No se pudo obtener URL pública' }, { status: 500 })
    }

    return NextResponse.json({ url: data.publicUrl })
  } catch (error: any) {
    console.error('Upload comprobante error:', error)
    if (error?.message === 'Unauthorized') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
