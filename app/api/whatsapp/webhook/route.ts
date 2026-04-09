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
    const formData = await req.formData()
    const originalBody = (formData.get('Body') as string)?.trim() ?? ''
    const body = originalBody.toUpperCase()
    const from = (formData.get('From') as string) ?? ''

    // 1. Extraer los 10 dígitos del que envía
    const senderDigits = from.replace(/\D/g, '').match(/\d{10}$/)?.[0] || from.replace(/\D/g, '')

    // 2. Buscar negocio (Buscamos que los dígitos existan dentro del campo whatsapp o telefono)
    // Usamos una búsqueda más agresiva: quitamos todo lo que no sea número en la BD también (opcional pero complejo en or)
    // Por ahora, ilike con % alrededor de los dígitos es lo más seguro.
    const { data: negocio, error: dbError } = await supabase
      .from('negocios')
      .select('*')
      .or(`whatsapp.ilike.%${senderDigits}%,telefono.ilike.%${senderDigits}%`)
      .single()

    if (dbError) console.error("Database error:", dbError);

    if (!negocio) {
      return twimlResponse(
        `❌ *Error de Identificación*\n\n` +
        `No reconozco el número: *${from}*\n\n` +
        `Dígitos detectados: ${senderDigits}\n\n` +
        `Asegúrate de que este número esté guardado EXACTAMENTE así (o que contenga estos 10 dígitos) en el panel de Supabase.`
      );
    }

    // --- COMANDOS CONOCIDOS ---
    if (body === 'SI' || body === 'SÍ') {
      await supabase.from('negocios').update({ disponible: true }).eq('id', negocio.id);
      const { data: reservas } = await supabase.from('reservaciones').select('*').eq('negocio_id', negocio.id).eq('estatus', 'pendiente').order('created_at', { ascending: false }).limit(1);
      if (reservas?.length) {
          await supabase.from('reservaciones').update({ estatus: 'confirmada' }).eq('id', reservas[0].id);
      }
      return twimlResponse('✅ Reservación CONFIRMADA. ¡Prepara todo!');
    }

    if (body === 'NO') {
      const { data: reservas } = await supabase.from('reservaciones').select('*').eq('negocio_id', negocio.id).eq('estatus', 'pendiente').order('created_at', { ascending: false }).limit(1);
      if (reservas?.length) {
          await supabase.from('reservaciones').update({ estatus: 'rechazada' }).eq('id', reservas[0].id);
      }
      return twimlResponse('❌ Reservación RECHAZADA. El cliente ya fue avisado.');
    }

    if (body === 'STATS' || body === 'ESTADÍSTICAS') {
      const { count: pendientes } = await supabase.from('reservaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', negocio.id).eq('estatus', 'pendiente');
      const { count: confirmadas } = await supabase.from('reservaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', negocio.id).eq('estatus', 'confirmada');

      return twimlResponse(
        `📊 *Status: ${negocio.nombre}*\n\n` +
        `⏳ Reservas por confirmar: ${pendientes || 0}\n` +
        `✅ Ventas hoy: ${confirmadas || 0}\n` +
        `⭐ Reputación: ${negocio.calificacion}/5\n\n` +
        `Estado: ${negocio.disponible ? '🟢 ABIERTO' : '🔴 CERRADO'}`
      );
    }

    if (body === 'ABRIR') {
      await supabase.from('negocios').update({ disponible: true }).eq('id', negocio.id);
      return twimlResponse(`✅ *${negocio.nombre}* está ahora EN VIVO.`);
    }

    if (body === 'CERRAR') {
      await supabase.from('negocios').update({ disponible: false }).eq('id', negocio.id);
      return twimlResponse(`🔴 *${negocio.nombre}* está ahora FUERA DE LÍNEA.`);
    }

    if (body === 'AYUDA' || body === 'HELP' || body === 'MENU') {
      return twimlResponse(
        `🤖 *Asistente Host LocalFest*\n\n` +
        `• *STATS*: Ver reservas y ventas\n` +
        `• *ABRIR/CERRAR*: Cambiar tu estado\n` +
        `• *Cualquier otro texto*: Se publicará como "Mensaje Flash" en tu perfil público.`
      );
    }

    // FALLBACK: ¿Es un mensaje flash o un error?
    // Si el mensaje es muy corto (ej: una letra al azar), asumimos error. 
    // Si es una frase, asumimos Flash.
    if (originalBody.length < 3) {
      return twimlResponse('🤔 No entendí ese comando. Escribe *AYUDA* para ver la lista.');
    }

    await supabase.from('negocios').update({ 
      mensaje_flash: originalBody, 
      flash_updated_at: new Date().toISOString() 
    }).eq('id', negocio.id);

    return twimlResponse(`🚀 *Flash Publicado:*\n\n"${originalBody}"\n\n_Tus clientes ya pueden ver esto en la página principal._`);

  } catch (error: any) {
    console.error('CRITICAL WEBHOOK ERROR:', error);
    return twimlResponse('💀 Error técnico: ' + error.message);
  }
}

