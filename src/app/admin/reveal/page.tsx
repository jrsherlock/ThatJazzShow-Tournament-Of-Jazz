import { createServerClient } from '@/lib/supabase';
import type { Tournament, MasterBracket } from '@/lib/types';
import RevealControls from '@/components/admin/RevealControls';

export const dynamic = 'force-dynamic';

export default async function AdminRevealPage() {
  const supabase = createServerClient();

  // Fetch the latest tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournament')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (tournamentError || !tournament) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-foreground mb-2">No Tournament Found</h2>
        <p className="text-dim">Create a tournament first from the Dashboard.</p>
      </div>
    );
  }

  // Fetch the master bracket for this tournament
  const { data: masterBracket, error: bracketError } = await supabase
    .from('master_bracket')
    .select('*')
    .eq('tournament_id', tournament.id)
    .single();

  if (bracketError || !masterBracket) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold text-foreground mb-2">No Master Bracket Found</h2>
        <p className="text-dim">
          Set up the master bracket before revealing results.
        </p>
      </div>
    );
  }

  return (
    <RevealControls
      tournament={tournament as Tournament}
      masterBracket={masterBracket as MasterBracket}
    />
  );
}
