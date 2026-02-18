import { createServerClient } from '@/lib/supabase';
import type { Artist, Tournament, MatchupPreview } from '@/lib/types';
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
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#1A1A1A] border border-[#D4A843]/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#D4A843]/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V4.5A2.25 2.25 0 0016.5 2.25H6a2.25 2.25 0 00-2.25 2.25v15A2.25 2.25 0 006 21.75h4.5"
              />
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#D4A843] mb-3">
            The Tournament of Jazz
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-6">
            {tournament?.status === 'setup'
              ? 'The tournament is being set up. Check back soon to fill out your bracket.'
              : tournament?.status === 'closed'
                ? 'Submissions are now closed. Stay tuned for the results reveal!'
                : tournament?.status === 'revealing'
                  ? 'The results are being revealed. Check back to see how your bracket stacks up.'
                  : tournament?.status === 'complete'
                    ? 'This tournament has concluded. Thanks for playing!'
                    : 'The Tournament of Jazz is not currently accepting brackets. Check back soon!'}
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2 text-sm text-[#D4A843] border border-[#D4A843]/30 rounded-lg hover:bg-[#D4A843]/10 transition-colors"
          >
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  // Fetch all artists
  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .order('seed', { ascending: true });

  // Fetch matchup previews for this tournament
  const { data: previews } = await supabase
    .from('matchup_previews')
    .select('*')
    .eq('tournament_id', tournament.id);

  return (
    <BracketBuilder
      artists={(artists as Artist[]) ?? []}
      tournament={tournament as Tournament}
      previews={(previews as MatchupPreview[]) ?? []}
    />
  );
}
