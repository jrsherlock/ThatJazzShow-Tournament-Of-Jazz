import { createServerClient } from '@/lib/supabase';
import type { Artist, Tournament, MatchupPreview } from '@/lib/types';
import { MatchupPreviewEditor } from '@/components/admin/MatchupPreviewEditor';

export default async function MatchupPreviewsPage() {
  const supabase = createServerClient();

  const { data: tournament } = await supabase
    .from('tournament')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!tournament) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-accent">No Tournament Found</h2>
        <p className="text-muted mt-2">Create a tournament from the dashboard first.</p>
      </div>
    );
  }

  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .order('region')
    .order('seed');

  const { data: previews } = await supabase
    .from('matchup_previews')
    .select('*')
    .eq('tournament_id', tournament.id);

  return (
    <div>
      <h1 className="text-3xl font-bold text-accent mb-2">Matchup Previews</h1>
      <p className="text-muted mb-8">
        Write Game Preview content for each Round 1 matchup. Participants will see this when they click a matchup.
      </p>
      <MatchupPreviewEditor
        tournament={tournament as Tournament}
        artists={(artists ?? []) as Artist[]}
        existingPreviews={(previews ?? []) as MatchupPreview[]}
      />
    </div>
  );
}
