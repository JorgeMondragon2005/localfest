import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const body = formData.get('Body') as string
  const from = formData.get('From') as string

  const respuesta = body?.trim().toUpperCase()

  if (respuesta === 'SI' || respuesta === 'SÍ') {
    // Busca el negocio por su número de WhatsApp
    const numero = from.replace('whatsapp:+52', '')
    await supabase
      .from('negocios')
      .update({ disponible: true })
      .eq('telefono', numero)
  }

  // Twilio espera respuesta en XML
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>✅ Confirmado. El turista está en camino.</Message>
    </Response>`,
    { headers: { 'Content-Type': 'text/xml' } }
  )
}
