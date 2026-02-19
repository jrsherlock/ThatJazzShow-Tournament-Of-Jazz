import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase';
import { scoreAndRankSubmissions } from '@/lib/scoring';
import type { Tournament, MasterBracket, Submission } from '@/lib/types';
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Leaderboard | Tournament of Jazz',
};

export default async function LeaderboardPage() {
  const supabase = createServerClient();

  // Fetch the latest tournament
  const { data: tournament } = await supabase
    .from('tournament')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single<Tournament>();

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="font-display text-3xl font-bold text-accent mb-4">
            No Tournament Found
          </h1>
          <p className="text-muted font-sans">
            There is no active tournament at this time. Check back later.
          </p>
        </div>
      </div>
    );
  }

  // Fetch the master bracket for this tournament
  const { data: masterBracket } = await supabase
    .from('master_bracket')
    .select('*')
    .eq('tournament_id', tournament.id)
    .limit(1)
    .single<MasterBracket>();

  // Fetch all submissions for this tournament
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('tournament_id', tournament.id)
    .returns<Submission[]>();

  const allSubmissions = submissions ?? [];
  const revealedThrough = masterBracket?.revealed_through ?? 0;
  const masterPicks = masterBracket?.picks ?? {};

  // Score and rank all submissions
  const rankedEntries = scoreAndRankSubmissions(
    allSubmissions.map((s) => ({
      id: s.id,
      display_name: s.display_name,
      picks: s.picks,
      access_token: s.access_token,
    })),
    masterPicks,
    revealedThrough
  );

  return (
    <main className="min-h-screen bg-background">
      <LeaderboardTable
        entries={rankedEntries}
        revealedThrough={revealedThrough}
        tournamentName={tournament.name}
      />
    </main>
  );
}
