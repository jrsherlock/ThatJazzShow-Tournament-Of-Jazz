import { createServerClient } from '@/lib/supabase';
import type { Tournament, MasterBracket, Submission } from '@/lib/types';
import { scoreAndRankSubmissions } from '@/lib/scoring';
import SubmissionsTable from '@/components/admin/SubmissionsTable';

export const dynamic = 'force-dynamic';

export default async function AdminSubmissionsPage() {
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

  // Fetch master bracket
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
          Set up the master bracket before viewing submissions.
        </p>
      </div>
    );
  }

  // Fetch all submissions for this tournament
  const { data: submissions, error: submissionsError } = await supabase
    .from('submissions')
    .select('*')
    .eq('tournament_id', tournament.id)
    .order('created_at', { ascending: true });

  if (submissionsError) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400">Failed to load submissions: {submissionsError.message}</p>
      </div>
    );
  }

  const typedMasterBracket = masterBracket as MasterBracket;
  const typedSubmissions = (submissions as Submission[]) || [];
  const revealedThrough = typedMasterBracket.revealed_through;

  // Score and rank all submissions
  const rankedSubmissions = scoreAndRankSubmissions(
    typedSubmissions,
    typedMasterBracket.picks,
    revealedThrough
  );

  return (
    <SubmissionsTable
      rankedSubmissions={rankedSubmissions}
      revealedThroughRound={revealedThrough}
      tournamentName={tournament.name as string}
    />
  );
}
