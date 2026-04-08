import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabase
    .from('negocios')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return new NextResponse(JSON.stringify({ error }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  return new NextResponse(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('negocios')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return new NextResponse(JSON.stringify({ error }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  return new NextResponse(JSON.stringify(data), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}
