import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const body = await request.json();
  const { tournament_id, round } = body;

  if (!tournament_id) {
    return NextResponse.json({ error: 'tournament_id is required' }, { status: 400 });
  }

  if (round === undefined || round < 1 || round > 6) {
    return NextResponse.json(
      { error: 'round is required and must be between 1 and 6' },
      { status: 400 }
    );
  }

  // Get the current master bracket to check revealed_through
  const { data: bracket, error: fetchError } = await supabase
    .from('master_bracket')
    .select('id, revealed_through')
    .eq('tournament_id', tournament_id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!bracket) {
    return NextResponse.json(
      { error: 'No master bracket found for this tournament' },
      { status: 404 }
    );
  }

  // Only allow increasing, not decreasing (irreversible reveal)
  if (round <= bracket.revealed_through) {
    return NextResponse.json(
      {
        error: `Cannot reveal round ${round}. Already revealed through round ${bracket.revealed_through}. Reveals are irreversible.`,
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('master_bracket')
    .update({
      revealed_through: round,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bracket.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
