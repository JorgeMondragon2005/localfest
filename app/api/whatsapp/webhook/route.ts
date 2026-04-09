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
    const textData = await req.text();
    const params = new URLSearchParams(textData);
    
    const originalBody = params.get('Body')?.trim() ?? ''
    const body = originalBody.toUpperCase()
    const from = params.get('From') ?? ''

    // Extraemos exactamente los últimos 10 dígitos para ignorar variantes como +521 o códigos foráneos
    const cleanNumber = from.replace(/\D/g, '')
    const digitRegex = cleanNumber.match(/\d{10}$/) 
    const numero = digitRegex ? digitRegex[0] : cleanNumber;

    // Busca el negocio por número de WhatsApp usando estatus de 10 dígitos
    const { data: negocio } = await supabase
      .from('negocios')
      .select('*')
      .or(`whatsapp.eq.${numero},telefono.eq.${numero}`)
      .single()

    // --- CONFIRMACIÓN DE RESERVACIÓN ---
    if (body === 'SI' || body === 'SÍ') {
      if (negocio) {
        await supabase.from('negocios').update({ disponible: true }).eq('id', negocio.id)
          
        const { data: reservas } = await supabase
            .from('reservaciones').select('*').eq('negocio_id', negocio.id).eq('estatus', 'pendiente').order('created_at', { ascending: false }).limit(1);
            
        if (reservas && reservas.length > 0) {
            await supabase.from('reservaciones').update({ estatus: 'confirmada' }).eq('id', reservas[0].id);
        }
      }
      return twimlResponse('✅ ¡Reservación confirmada! El turista está en camino.')
    }

    if (body === 'NO') {
      if (negocio) {
        const { data: reservas } = await supabase
            .from('reservaciones').select('*').eq('negocio_id', negocio.id).eq('estatus', 'pendiente').order('created_at', { ascending: false }).limit(1);
            
        if (reservas && reservas.length > 0) {
            await supabase.from('reservaciones').update({ estatus: 'rechazada' }).eq('id', reservas[0].id);
        }
      }
      return twimlResponse('❌ Reservación rechazada. El turista ha sido notificado.')
    }

    // --- COMANDOS DE ESTABLECIMIENTO ---
    if (!negocio) {
      return twimlResponse(
        '⚠️ No encontramos tu negocio registrado con este teléfono en LocalFest.\n\nContáctanos si crees que esto es un error.'
      )
    }

    if (body === 'STATS' || body === 'ESTADÍSTICAS' || body === 'ESTADISTICAS') {
      return twimlResponse(
        `📊 *Estadísticas de ${negocio.nombre}*\n\n` +
        `⭐ Calificación: ${negocio.calificacion}/5\n` +
        `🟢 Estado actual: ${negocio.disponible ? 'Abierto' : 'Cerrado'}\n` +
        `📍 Dirección: ${negocio.direccion}\n` +
        `🕐 Horario: ${negocio.horario ?? 'No especificado'}\n\n` +
        `Escribe AYUDA para ver más comandos.`
      )
    }

    if (body === 'ABRIR') {
      await supabase.from('negocios').update({ disponible: true }).eq('id', negocio.id)
      return twimlResponse(`✅ *${negocio.nombre}* ahora aparece como *Abierto* en LocalFest.\n\nLos turistas ya pueden encontrarte.`)
    }

    if (body === 'CERRAR') {
      await supabase.from('negocios').update({ disponible: false }).eq('id', negocio.id)
      return twimlResponse(`🔴 *${negocio.nombre}* ahora aparece como *Cerrado* en LocalFest.\n\nNo recibirás notificaciones turísticas.`)
    }

    if (body === 'PERFIL') {
      return twimlResponse(
        `🏪 *Tu perfil en LocalFest*\n\n` +
        `Nombre: ${negocio.nombre}\n` +
        `Categoría: ${negocio.categoria}\n` +
        `Descripción: ${negocio.descripcion}\n` +
        `Horario: ${negocio.horario ?? 'No especificado'}\n` +
        `Calificación: ${negocio.calificacion}/5 ⭐\n` +
        `Estado: ${negocio.disponible ? '🟢 Abierto' : '🔴 Cerrado'}`
      )
    }

    if (body === 'AYUDA' || body === 'HELP' || body === 'MENU' || body === 'MENÚ') {
      return twimlResponse(
        `🤖 *Comandos Host LocalFest*\n\n` +
        `📊 *STATS* — Ver tus números\n` +
        `👤 *PERFIL* — Ver tu perfil\n` +
        `🟢 *ABRIR* — Abrir turno\n` +
        `🔴 *CERRAR* — Finalizar turno\n\n` +
        `Responde *SÍ* o *NO* a una reserva para confirmar.\n\n` +
        `Cualquier otro mensaje que envíes se mostrará como un MENSAJE FLASH para los turistas en la app.`
      )
    }
    
    // Si no es ningún comando, lo asigna como MENSAJE FLASH
    await supabase
        .from('negocios')
        .update({ 
          mensaje_flash: originalBody,
          flash_updated_at: new Date().toISOString()
        })
        .eq('id', negocio.id);

    return twimlResponse(
      `🚀 Mensaje Flash actualizado al instante en LocalFest:\n\n"${originalBody}"`
    )

  } catch (error) {
    console.error('Error procesando webhook:', error);
    return new NextResponse('<Response></Response>', { status: 500, headers: {'Content-Type': 'text/xml'} });
  }
}
