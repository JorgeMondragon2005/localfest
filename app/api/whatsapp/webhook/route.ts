import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ruta dedicada para recibir los Webhooks de Twilio
// Twilio form data send urlencoded POST requests
export async function POST(req: NextRequest) {
  try {
    const textData = await req.text();
    const params = new URLSearchParams(textData);
    
    // Twilio envía 'Body' y 'From' (ej: whatsapp:+521234567890)
    const originalBody = params.get('Body')?.trim() || '';
    const body = originalBody.toUpperCase();
    const from = params.get('From') || '';

    // Extraer celular
    const celularNegocio = from.replace('whatsapp:+52', '').replace('whatsapp:', '');

    // Buscar negocio en DB por teléfono
    const { data: negocio } = await supabase
      .from('negocios')
      .select('id')
      .eq('whatsapp', celularNegocio)
      .single();

    if (!negocio) {
      return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    // Pivot 1: TABLERO VIVO. Si el mensaje NO es una confirmación de reserva (SÍ/NO), es un MENSAJE FLASH
    if (body !== 'SÍ' && body !== 'NO' && body !== 'SI') {
      await supabase
        .from('negocios')
        .update({ 
          mensaje_flash: originalBody, 
          flash_updated_at: new Date().toISOString() 
        })
        .eq('id', negocio.id);
        
      return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    // Pivot 2: Es una confirmación de reserva (SÍ/NO). Buscar la última reserva pendiente
    const { data: reservacion } = await supabase
      .from('reservaciones')
      .select('*')
      .eq('negocio_id', negocio.id)
      .eq('estatus', 'pendiente')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (reservacion) {
      const nuevoEstatus = (body === 'SÍ' || body === 'SI') ? 'confirmada' : 'rechazada';

        await supabase
          .from('reservaciones')
          .update({ estatus: nuevoEstatus })
          .eq('id', reservacion.id);

        // Opcional: Aquí podrías enviar un WhatsApp o SMS de vuelta al TURISTA 
        // indicando que su reservación fue confirmada o rechazada.
      }

    // Twilio siempre espera XML de regreso (TwiML)
    return new NextResponse('<Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error en el webhook de whatsapp:', error);
    return new NextResponse('<Response></Response>', { status: 500, headers: {'Content-Type': 'text/xml'} });
  }
}

export async function GET() {
  return new NextResponse('Twilio Webhook activo', { status: 200 });
}
