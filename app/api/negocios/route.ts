import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('negocios')
    .select('*')
    .eq('disponible', true)

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}
