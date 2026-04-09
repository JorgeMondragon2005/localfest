import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ruta dedicada para recibir los Webhooks de Twilio
// Twilio form data send urlencoded POST requests
function twimlResponse(message: string) {
  return new NextResponse(
    `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Message>${message}</Message>
    </Response>`,
    { status: 200, headers: { 'Content-Type': 'text/xml' } }
  )
}

export async function GET() {
  return new NextResponse('Webhook activo', { status: 200 })
}

export async function POST(req: NextRequest) {
  try {
    let originalBody = '';
    let from = '';

    // PARSER BULLETPROOF: Intentar formData, si falla intentar text/params
    try {
      const formData = await req.formData();
      originalBody = (formData.get('Body') as string)?.trim() ?? '';
      from = (formData.get('From') as string) ?? '';
    } catch (e) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      originalBody = params.get('Body')?.trim() ?? '';
      from = params.get('From') ?? '';
    }

    if (!from) return twimlResponse('⚠️ No se detectó número de origen.');

    const body = originalBody.toUpperCase();
    const senderDigits = from.replace(/\D/g, '').match(/\d{10}$/)?.[0] || from.replace(/\D/g, '');

    // 2. BUSCAR NEGOCIO (Harden: Evitar matches vacíos y priorizar precisión)
    if (!senderDigits || senderDigits.length < 8) {
       return twimlResponse(`⚠️ Número mal formado (${from}).`);
    }

    const { data: negocios, error: dbError } = await supabase
      .from('negocios')
      .select('*')
      .or(`whatsapp.ilike.%${senderDigits},telefono.ilike.%${senderDigits},whatsapp.eq.${senderDigits},telefono.eq.${senderDigits}`)
      .limit(1)

    const negocio = negocios?.[0]

    // DEBUG INFO para el usuario
    const debugTag = `\n\n_Ref: ${from.split(':')[1] || from} | IDs: ${senderDigits}_`;

    if (dbError || !negocio) {
       console.error("Match error:", dbError);
       return twimlResponse(`❌ *No reconocido*\n\nEl sistema vio el número: ${senderDigits}.\nRevisa que en Supabase el WhatsApp termine exactamente en esos números.${debugTag}`);
    }

    // --- COMANDOS ---
    if (body === 'SI' || body === 'SÍ') {
      await supabase.from('negocios').update({ disponible: true }).eq('id', negocio.id);
      const { data: r } = await supabase.from('reservaciones').select('id').eq('negocio_id', negocio.id).eq('estatus', 'pendiente').order('created_at', { ascending: false }).limit(1).single();
      if (r) await supabase.from('reservaciones').update({ estatus: 'confirmada' }).eq('id', r.id);
      return twimlResponse('✅ Reservación CONFIRMADA.');
    }

    if (body === 'NO') {
      const { data: r } = await supabase.from('reservaciones').select('id').eq('negocio_id', negocio.id).eq('estatus', 'pendiente').order('created_at', { ascending: false }).limit(1).single();
      if (r) await supabase.from('reservaciones').update({ estatus: 'rechazada' }).eq('id', r.id);
      return twimlResponse('❌ Reservación RECHAZADA.');
    }

    if (body === 'STATS' || body === 'ESTADÍSTICAS' || body === 'ESTADISTICAS') {
      const { count: p } = await supabase.from('reservaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', negocio.id).eq('estatus', 'pendiente');
      const { count: c } = await supabase.from('reservaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', negocio.id).eq('estatus', 'confirmada');
      return twimlResponse(`📊 *${negocio.nombre}*\n\n⏳ Pendientes: ${p||0}\n✅ Ventas: ${c||0}\n⭐ Calif: ${negocio.calificacion}/5\n\nStatus: ${negocio.disponible?'🟢':'🔴'}`);
    }

    if (body === 'ABRIR') {
      await supabase.from('negocios').update({ disponible: true }).eq('id', negocio.id);
      return twimlResponse(`✅ *${negocio.nombre}* está ahora ABIERTO.`);
    }

    if (body === 'CERRAR') {
      await supabase.from('negocios').update({ disponible: false }).eq('id', negocio.id);
      return twimlResponse(`🔴 *${negocio.nombre}* está ahora CERRADO.`);
    }

    if (body === 'AYUDA' || body === 'HELP' || body === 'MENU') {
      return twimlResponse('🤖 Comandos: STATS, ABRIR, CERRAR. Cualquier otro texto actualiza tu Mensaje Flash.');
    }

    if (originalBody.length < 3) return twimlResponse('🤔 Comando no reconocido. Escribe AYUDA.');

    await supabase.from('negocios').update({ mensaje_flash: originalBody, flash_updated_at: new Date().toISOString() }).eq('id', negocio.id);
    return twimlResponse(`🚀 Flash Publicado: "${originalBody}"`);

  } catch (error: any) {
    console.error('WEBHOOK CRASH:', error);
    return twimlResponse('💀 Error: ' + error.message);
  }
}

