import twilio from 'twilio'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function POST(req: NextRequest) {
  const { negocioId, mensaje } = await req.json()

  const { data: negocio } = await supabase
    .from('negocios')
    .select('*')
    .eq('id', negocioId)
    .single()

  if (!negocio) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })

  await client.messages.create({
    from: process.env.TWILIO_WHATSAPP_FROM!,
    to: `whatsapp:+52${negocio.whatsapp}`,
    body: `🔔 Nueva solicitud OlaMX:\n${mensaje}\n\nResponde SÍ para confirmar o NO para rechazar.`
  })

  return NextResponse.json({ ok: true })
}
