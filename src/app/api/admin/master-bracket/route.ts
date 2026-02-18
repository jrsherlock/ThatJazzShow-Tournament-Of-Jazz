import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  // Get the most recent tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tournamentError) {
    return NextResponse.json({ error: tournamentError.message }, { status: 500 });
  }

  // Get the master bracket for that tournament
  const { data, error } = await supabase
    .from('master_bracket')
    .select('*')
    .eq('tournament_id', tournament.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned, which is fine (no bracket yet)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const body = await request.json();
  const { tournament_id, picks } = body;

  if (!tournament_id) {
    return NextResponse.json({ error: 'tournament_id is required' }, { status: 400 });
  }

  if (!picks || typeof picks !== 'object') {
    return NextResponse.json({ error: 'picks is required and must be an object' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('master_bracket')
    .upsert(
      {
        tournament_id,
        picks,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'tournament_id' }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
