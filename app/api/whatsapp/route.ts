import twilio from 'twilio'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

// Rate limiter básico en memoria
const IP_LIMITS = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  // 1. Rate Limiting protection
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limit = IP_LIMITS.get(ip);
  if (limit && limit.resetAt > Date.now() && limit.count >= 5) {
    return NextResponse.json({ error: 'Demasiadas peticiones. Espera un minuto.' }, { status: 429 });
  }
  if (limit && limit.resetAt < Date.now()) {
    IP_LIMITS.set(ip, { count: 1, resetAt: Date.now() + 60000 });
  } else {
    IP_LIMITS.set(ip, { count: (limit?.count || 0) + 1, resetAt: limit?.resetAt || Date.now() + 60000 });
  }

  const { negocioId, mensaje } = await req.json()

  const { data: negocio } = await supabase
    .from('negocios')
    .select('*')
    .eq('id', negocioId)
    .single()

  if (!negocio) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  // 2. Registrar en Base de Datos (Reservaciones) antes de enviar WS
  await supabase.from('reservaciones').insert({
    negocio_id: negocio.id,
    cliente_nombre: 'Turista (Desde Chat AI)',
    fecha_hora: mensaje, // Guardamos el resumen formateado por GPT
    estatus: 'pendiente'
  });

  // 3. Enviar SMS/WhatsApp vía Twilio
  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:+52${negocio.whatsapp}`,
    body: `🔔 Nueva solicitud OlaMX:\n${mensaje}\n\nResponde SÍ para confirmar o NO para rechazar.`
  })

  return NextResponse.json({ ok: true })
}
