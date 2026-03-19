import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createServerClient();

  // Fetch the latest tournament (most recently created)
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournament')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tournamentError || !tournament) {
    return NextResponse.json(
      { error: 'No tournament found' },
      { status: 404 }
    );
  }

  if (tournament.status !== 'open') {
    return NextResponse.json(
      {
        error: 'Tournament is not accepting submissions',
        status: tournament.status,
      },
      { status: 403 }
    );
  }

  // Fetch all threat actors
  const { data: actors, error: actorsError } = await supabase
    .from('threat_actors')
    .select('*')
    .order('seed', { ascending: true });

  if (actorsError) {
    return NextResponse.json(
      { error: 'Failed to fetch threat actors' },
      { status: 500 }
    );
  }

  // Fetch all matchup previews for this tournament
  const { data: previews, error: previewsError } = await supabase
    .from('matchup_previews')
    .select('*')
    .eq('tournament_id', tournament.id);

  if (previewsError) {
    return NextResponse.json(
      { error: 'Failed to fetch matchup previews' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    tournament,
    actors: actors ?? [],
    previews: previews ?? [],
  });
}
