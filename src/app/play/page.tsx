import { createServerClient } from '@/lib/supabase';
import type { ThreatActor, Tournament, MatchupPreview } from '@/lib/types';
import BracketBuilder from '@/components/bracket/BracketBuilder';

export const dynamic = 'force-dynamic';

export default async function PlayPage() {
  const supabase = createServerClient();

  // Fetch the latest tournament
  const { data: tournament } = await supabase
    .from('tournament')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!tournament || tournament.status !== 'open') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-surface-hover border border-accent/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-accent/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-accent mb-3">
            The Tournament of Threats
          </h1>
          <p className="text-muted text-sm leading-relaxed mb-6">
            {tournament?.status === 'setup'
              ? 'The tournament is being set up. Check back soon to fill out your bracket.'
              : tournament?.status === 'closed'
                ? 'Submissions are now closed. Stay tuned for the results reveal!'
                : tournament?.status === 'revealing'
                  ? 'The results are being revealed. Check back to see how your bracket stacks up.'
                  : tournament?.status === 'complete'
                    ? 'This tournament has concluded. Thanks for playing!'
                    : 'The Tournament of Threats is not currently accepting brackets. Check back soon!'}
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2 text-sm text-accent border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Fetch all threat actors
  const { data: actors } = await supabase
    .from('threat_actors')
    .select('*')
    .order('seed', { ascending: true });

  // Fetch matchup previews for this tournament
  const { data: previews } = await supabase
    .from('matchup_previews')
    .select('*')
    .eq('tournament_id', tournament.id);

  return (
    <BracketBuilder
      actors={(actors as ThreatActor[]) ?? []}
      tournament={tournament as Tournament}
      previews={(previews as MatchupPreview[]) ?? []}
    />
  );
}
