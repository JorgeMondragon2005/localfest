import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(req: NextRequest) {
  const { messages, negocioId } = await req.json()

  let contexto = ''
  if (negocioId) {
    const { data } = await supabase
      .from('negocios')
      .select('*')
      .eq('id', negocioId)
      .single()
    if (data) contexto = `Info del negocio: ${JSON.stringify(data)}`
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Eres un asistente turístico de OlaMX para el Mundial 2026 en México.
        Ayudas a turistas internacionales a encontrar y reservar en negocios locales.
        Responde siempre en el idioma del turista. Sé breve y amable.
        ${contexto}`
      },
      ...messages
    ]
  })

  return new NextResponse(JSON.stringify({ message: response.choices[0].message.content }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}
