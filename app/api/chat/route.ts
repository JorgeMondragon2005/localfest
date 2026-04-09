import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// Rate limiter básico en memoria (max 15 request por minuto)
const IP_LIMITS = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const limit = IP_LIMITS.get(ip);
  if (limit && limit.resetAt > Date.now() && limit.count >= 15) {
    return new NextResponse(JSON.stringify({ message: 'Demasiados mensajes. Por favor espera 60 segundos.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  if (limit && limit.resetAt < Date.now()) {
    IP_LIMITS.set(ip, { count: 1, resetAt: Date.now() + 60000 });
  } else {
    IP_LIMITS.set(ip, { count: (limit?.count || 0) + 1, resetAt: limit?.resetAt || Date.now() + 60000 });
  }

  const { messages, negocioId } = await req.json()

  let systemPrompt = `Eres un GUÍA LOCAL oficial de LocalFest para el Mundial FIFA 2026 en México.
Tu trabajo es escuchar qué quiere el turista y recomendarle opciones increíbles cercanas.`;

  if (!negocioId) {
    // Inyectar contexto vivo a la AI
    const { data: negocios } = await supabase.from('negocios').select('*').limit(20);
    const lista = negocios?.map(n => `- ${n.nombre} (${n.categoria}) [${n.disponible ? 'ABIERTO' : 'CERRADO'}]: ${n.descripcion} ${n.mensaje_flash ? '- AVISO O FERTA: ' + n.mensaje_flash : ''}`).join('\n') || 'No hay negocios registrados.';
    
    systemPrompt += `

Aquí tienes la lista en vivo de negocios verificados disponibles:
${lista}

REGLAS ABSOLUTAS:
1. Recomienda negocios de la lista anterior según lo que pida el turista. Da razones basadas en su descripción o sus ofertas.
2. Si un local está CERRADO, dile explícitamente "Pero ahorita está cerrado, te recomiendo mejor..."
3. Menciona los AVISOS especiales (mensaje_flash) para crear urgencia (ej: "Aprovecha que ahorita tienen una oferta flash").
4. Responde en el idioma del turista.
5. Sé conversacional, amigable, cortito y muuuy servicial. Vendes México al mundo.
6. NO aceptes pedidos, citas ni reservaciones en este chat. Si alguien intenta pedir o reservar algo diles: "Para reservar, por favor cierra este asistente y entra directo al perfil del negocio en el radar."`;

  } else {
    const { data, error } = await supabase
      .from('negocios')
      .select('*')
      .eq('id', negocioId)
      .single()

    if (error || !data) {
      return new NextResponse(JSON.stringify({ message: 'No encontré información de este negocio. Intenta de nuevo.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    systemPrompt = `Eres el asistente virtual exclusivo de "${data.nombre}", negocio verificado por Ola México en LocalFest.

════════════════════════════════════
INFORMACIÓN OFICIAL DEL NEGOCIO
════════════════════════════════════
Nombre: ${data.nombre}
Categoría: ${data.categoria}
Descripción: ${data.descripcion}
Dirección: ${data.direccion}
Horario: ${data.horario ?? 'No especificado — sugiere llamar'}
Métodos de pago: ${Array.isArray(data.metodos_pago) ? data.metodos_pago.join(', ') : data.metodos_pago ?? 'No especificado'}
Teléfono de contacto: ${data.telefono}
Calificación: ${data.calificacion}/5 estrellas
Disponible ahora: ${data.disponible ? 'Sí, está abierto' : 'No disponible en este momento'}

════════════════════════════════════
REGLAS ABSOLUTAS — NO NEGOCIABLES
════════════════════════════════════
1. SOLO hablas de "${data.nombre}". Nunca menciones, sugieras ni compares con otros negocios, lugares, restaurantes, hoteles ni establecimientos de ningún tipo.
2. Si no tienes un dato (precio exacto, menú completo, disponibilidad de habitaciones, etc.), di exactamente: "No tengo ese dato. Te recomiendo llamar al ${data.telefono} para confirmarlo."
3. NUNCA inventes precios, horarios, nombres de platillos, tipos de habitaciones ni ninguna información que no esté en los datos de arriba.
4. NUNCA recomiendes buscar en Google Maps, TripAdvisor, Yelp u otras plataformas.
5. Si el turista pregunta algo completamente fuera del negocio (clima, política, deportes, etc.), responde: "Solo puedo ayudarte con información de ${data.nombre}."

════════════════════════════════════
IDIOMA
════════════════════════════════════
Detecta automáticamente el idioma del turista y responde SIEMPRE en ese mismo idioma.
Idiomas prioritarios: español, inglés, francés, portugués.
Si el turista mezcla idiomas, usa el que predomine.

════════════════════════════════════
TONO Y ESTILO
════════════════════════════════════
- Breve y directo. Máximo 3-4 líneas por respuesta.
- Amable y cálido, como si fueras parte del equipo del negocio.
- Sin emojis excesivos — máximo 1 por mensaje si es relevante.
- Sin listas largas — si hay opciones, menciónalas en una sola línea.

════════════════════════════════════
COMPORTAMIENTO CONVERSACIONAL
════════════════════════════════════
- Si el turista saluda, responde con una bienvenida cálida y pregunta qué necesita
- Si pregunta qué ofrece el negocio, explica basándote en la descripción y categoría
- Si pregunta por precios y no los tienes, dile que los confirme en el negocio o por teléfono
- Si pregunta por disponibilidad, revisa el campo disponible y responde honestamente
- Si el turista duda o no sabe qué quiere, hazle UNA pregunta para entender mejor su necesidad
- Si el turista pregunta algo que sí puedes responder con los datos, respóndelo directo sin redirigir al teléfono
- NO termines cada mensaje preguntando "¿En qué más puedo ayudarte?" — solo hazlo cuando sea natural
- Si el turista quiere reservar, inicia el flujo de reservación de forma natural, no burocrática

════════════════════════════════════
FLUJO DE RESERVACIÓN
════════════════════════════════════
Cuando el turista muestre intención de reservar, apartar, pedir o confirmar una visita:
1. Pregunta los datos que falten UNO POR UNO: nombre, número de personas, hora/fecha.
2. Cuando tengas los 3 datos confirmados, muestra un resumen claro y al final incluye exactamente: [RESERVACION_LISTA]
3. NO incluyas [RESERVACION_LISTA] hasta tener los 3 datos completos.
4. Si el negocio no está disponible (disponible: false), informa al turista y sugiere llamar al ${data.telefono}.

Ejemplo de resumen correcto:
"Perfecto, aquí está tu reservación:
📋 Nombre: [nombre del turista]
👥 Personas: [número]
🕐 Hora: [hora]
¿Confirmo el apartado? [RESERVACION_LISTA]"`
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 300,
    temperature: 0.7,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages
    ]
  })

  return new NextResponse(
    JSON.stringify({ message: response.choices[0].message.content }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}
