import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { searchParams } = new URL(request.url);
  const tournamentId = searchParams.get('tournament_id');

  if (!tournamentId) {
    return NextResponse.json({ error: 'tournament_id query param is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('matchup_previews')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('created_at', { ascending: true });

  if (error) {
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
  const { tournament_id, matchup_key, headline, preview_text, fun_fact } = body;

  if (!tournament_id) {
    return NextResponse.json({ error: 'tournament_id is required' }, { status: 400 });
  }

  if (!matchup_key) {
    return NextResponse.json({ error: 'matchup_key is required' }, { status: 400 });
  }

  if (!preview_text) {
    return NextResponse.json({ error: 'preview_text is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('matchup_previews')
    .insert({
      tournament_id,
      matchup_key,
      headline: headline || null,
      preview_text,
      fun_fact: fun_fact || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const body = await request.json();
  const { id, headline, preview_text, fun_fact, matchup_key } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (headline !== undefined) updates.headline = headline;
  if (preview_text !== undefined) updates.preview_text = preview_text;
  if (fun_fact !== undefined) updates.fun_fact = fun_fact;
  if (matchup_key !== undefined) updates.matchup_key = matchup_key;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('matchup_previews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
