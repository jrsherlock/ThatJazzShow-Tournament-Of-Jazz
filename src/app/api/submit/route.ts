import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const body = await request.json();
  const { tournament_id, display_name, picks } = body;

  if (!tournament_id) {
    return NextResponse.json({ error: 'tournament_id is required' }, { status: 400 });
  }

  if (!display_name || typeof display_name !== 'string' || display_name.trim().length === 0) {
    return NextResponse.json(
      { error: 'display_name is required and must be a non-empty string' },
      { status: 400 }
    );
  }

  if (!picks || typeof picks !== 'object' || Object.keys(picks).length === 0) {
    return NextResponse.json(
      { error: 'picks is required and must be a non-empty object' },
      { status: 400 }
    );
  }

  const access_token = randomUUID();

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      tournament_id,
      display_name: display_name.trim(),
      picks,
      access_token,
    })
    .select('id, access_token')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { id: data.id, access_token: data.access_token },
    { status: 201 }
  );
}
