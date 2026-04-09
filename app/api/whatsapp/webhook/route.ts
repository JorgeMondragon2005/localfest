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

    console.log(`[WEBHOOK] Incoming from ${from}: ${body}`);

    // Extraemos exactamente los últimos 10 dígitos
    const cleanNumber = from.replace(/\D/g, '')
    const digitRegex = cleanNumber.match(/\d{10}$/) 
    const numero = digitRegex ? digitRegex[0] : cleanNumber;

    // Busca el negocio usando coincidencia parcial (los últimos 10 dígitos)
    const { data: negocio, error: dbError } = await supabase
      .from('negocios')
      .select('*')
      .or(`whatsapp.ilike.%${numero},telefono.ilike.%${numero}`)
      .single()

    if (dbError) console.error("Database error looking for negocio:", dbError);

    // --- CONFIRMACIÓN DE RESERVACIÓN ---
    if (body === 'SI' || body === 'SÍ') {
      if (negocio) {
        await supabase.from('negocios').update({ disponible: true }).eq('id', negocio.id);
        const { data: reservas } = await supabase.from('reservaciones').select('*').eq('negocio_id', negocio.id).eq('estatus', 'pendiente').order('created_at', { ascending: false }).limit(1);
        if (reservas?.length) {
            await supabase.from('reservaciones').update({ estatus: 'confirmada' }).eq('id', reservas[0].id);
        }
      }
      return twimlResponse('✅ Reservación confirmada. El turista está en camino.');
    }

    if (body === 'NO') {
      if (negocio) {
        const { data: reservas } = await supabase.from('reservaciones').select('*').eq('negocio_id', negocio.id).eq('estatus', 'pendiente').order('created_at', { ascending: false }).limit(1);
        if (reservas?.length) {
            await supabase.from('reservaciones').update({ estatus: 'rechazada' }).eq('id', reservas[0].id);
        }
      }
      return twimlResponse('❌ Reservación rechazada. El turista ha sido notificado.');
    }

    if (!negocio) {
      return twimlResponse('⚠️ No encontramos tu negocio registrado en LocalFest con el número ' + numero);
    }

    if (body === 'STATS' || body === 'ESTADÍSTICAS' || body === 'ESTADISTICAS') {
      const { count: pendientes } = await supabase.from('reservaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', negocio.id).eq('estatus', 'pendiente');
      const { count: confirmadas } = await supabase.from('reservaciones').select('*', { count: 'exact', head: true }).eq('negocio_id', negocio.id).eq('estatus', 'confirmada');

      return twimlResponse(
        `📊 *Estadísticas de ${negocio.nombre}*\n\n` +
        `⏳ Pendientes: ${pendientes || 0}\n` +
        `✅ Confirmadas: ${confirmadas || 0}\n` +
        `⭐ Calificación: ${negocio.calificacion}/5\n` +
        `🟢 Estado: ${negocio.disponible ? 'Abierto' : 'Cerrado'}\n\n` +
        `_LocalFest App 2026_`
      );
    }

    if (body === 'ABRIR') {
      await supabase.from('negocios').update({ disponible: true }).eq('id', negocio.id);
      return twimlResponse(`✅ *${negocio.nombre}* está ahora ABIERTO.`);
    }

    if (body === 'CERRAR') {
      await supabase.from('negocios').update({ disponible: false }).eq('id', negocio.id);
      return twimlResponse(`🔴 *${negocio.nombre}* está ahora CERRADO.`);
    }

    if (body === 'AYUDA' || body === 'MENU') {
      return twimlResponse('🤖 Comandos: STATS, ABRIR, CERRAR, PERFIL. O envía un mensaje para actualizar tu estatus Flash.');
    }

    // Default: Mensaje flash
    await supabase.from('negocios').update({ mensaje_flash: originalBody, flash_updated_at: new Date().toISOString() }).eq('id', negocio.id);
    return twimlResponse(`🚀 Flash actualizado: "${originalBody}"`);

  } catch (error: any) {
    console.error('CRITICAL WEBHOOK ERROR:', error);
    return twimlResponse('💀 Error interno en el servidor LocalFest: ' + error.message);
  }
}

