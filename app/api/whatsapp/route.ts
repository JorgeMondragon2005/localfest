import twilio from 'twilio'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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

  // 1.5. Traducir el mensaje del turista al ESPAÑOL para el dueño del local
  let mensajeTraducido = mensaje;
  try {
    const translation = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres un sistema de traducción para dueños de negocios locales en México. Traduce y resume la siguiente solicitud de reservación/pedido al ESPAÑOL de forma amable, clara y directa. Solo responde con la traducción formateada, sin comillas ni intros.' },
        { role: 'user', content: mensaje }
      ],
      max_tokens: 150,
      temperature: 0.3
    });
    mensajeTraducido = translation.choices[0].message.content || mensaje;
  } catch (err) {
    console.error("Error traduciendo el mensaje:", err);
  }

  // 2. Registrar en Base de Datos (Reservaciones) antes de enviar WS
  await supabase.from('reservaciones').insert({
    negocio_id: negocio.id,
    cliente_nombre: 'Turista (Plataforma)',
    fecha_hora: mensajeTraducido, 
    estatus: 'pendiente'
  });

  // 3. Enviar SMS/WhatsApp vía Twilio
  try {
    let message;
    const cleanNum = negocio.whatsapp.replace(/\D/g, '');
    
    // Hackathon trick: En México el Sandbox de Twilio a veces fuerza el +521 interno
    try {
      message = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM!,
        to: `whatsapp:+521${cleanNum}`,
        body: `🔔 Nueva solicitud LocalFest:\n${mensajeTraducido}\n\nResponde SÍ para confirmar o NO para rechazar.`
      })
    } catch (fallbackErr) {
      message = await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM!,
        to: `whatsapp:+52${cleanNum}`,
        body: `🔔 Nueva solicitud LocalFest:\n${mensajeTraducido}\n\nResponde SÍ para confirmar o NO para rechazar.`
      })
    }

    console.log("TWILIO EXITO:", message.sid)
    return NextResponse.json({ ok: true, sid: message.sid })
  } catch (error: any) {
    console.error("TWILIO ERROR CRÍTICO:", error)
    return NextResponse.json({ error: error.message || 'Error desconocido en Twilio' }, { status: 500 })
  }
}
