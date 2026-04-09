import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Ruta dedicada para recibir los Webhooks de Twilio
// Twilio form data send urlencoded POST requests
export async function POST(req: NextRequest) {
  try {
    const textData = await req.text();
    const params = new URLSearchParams(textData);
    
    // Twilio envía 'Body' y 'From' (ej: whatsapp:+521234567890)
    const body = params.get('Body')?.trim().toUpperCase() || '';
    const from = params.get('From') || '';

    // Si el mensaje no es una confirmación/rechazo clara, no hacemos nada
    if (body !== 'SÍ' && body !== 'NO' && body !== 'SI') {
      return new NextResponse('<Response></Response>', {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Extraer celular
    const celularNegocio = from.replace('whatsapp:+52', '').replace('whatsapp:', '');

    // Buscar negocio en DB por teléfono
    const { data: negocio } = await supabase
      .from('negocios')
      .select('id')
      .eq('whatsapp', celularNegocio)
      .single();

    if (negocio) {
      // Buscar la reservación pendiente más reciente de este negocio para actualizar
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
