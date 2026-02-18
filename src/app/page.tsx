import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';
import { REGIONS, REGION_LABELS, REGION_SUBTITLES } from '@/lib/constants';
import type { Tournament, TournamentStatus } from '@/lib/types';
import CountdownTimer from '@/components/ui/CountdownTimer';

/* ------------------------------------------------------------------ */
/*  Region descriptions for the landing page                          */
/* ------------------------------------------------------------------ */
const REGION_DESCRIPTIONS: Record<string, string> = {
  vocalists:
    'The voices that defined generations. From sultry balladeers to scat-singing pioneers, these storytellers turned melody into poetry.',
  bandleaders:
    'The visionaries who built empires of sound. Conductors, arrangers, and bandstand legends who shaped the ensemble into art.',
  composers:
    'The writers behind the standards. These authors penned the melodies and harmonies that became the Great American Songbook.',
  soloists:
    'The virtuosos who pushed their instruments to the limit. Improvisers, innovators, and the daring voices of bebop, cool, and beyond.',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function statusLabel(status: TournamentStatus): string {
  switch (status) {
    case 'setup':
      return 'Coming Soon';
    case 'open':
      return 'Open for Submissions';
    case 'closed':
      return 'Submissions Closed';
    case 'revealing':
      return 'Reveal in Progress';
    case 'complete':
      return 'Tournament Complete';
    default:
      return status;
  }
}

/* ------------------------------------------------------------------ */
/*  Data fetching                                                      */
/* ------------------------------------------------------------------ */
async function getTournamentData() {
  const supabase = createServerClient();

  const { data: tournaments } = await supabase
    .from('tournament')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  const tournament: Tournament | null =
    tournaments && tournaments.length > 0 ? tournaments[0] : null;

  let submissionCount = 0;
  let artistCount = 0;

  if (tournament) {
    const { count: sCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournament.id);

    const { count: aCount } = await supabase
      .from('artists')
      .select('*', { count: 'exact', head: true });

    submissionCount = sCount ?? 0;
    artistCount = aCount ?? 0;
  }

  return { tournament, submissionCount, artistCount };
}

/* ------------------------------------------------------------------ */
/*  Step icons (inline SVGs)                                           */
/* ------------------------------------------------------------------ */
function ExploreIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#D4A843" strokeWidth="1.5" fill="none" />
      <path d="M15 13h10M15 20h10M15 27h7" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="13" r="1.5" fill="#D4A843" />
      <circle cx="11" cy="20" r="1.5" fill="#D4A843" />
      <circle cx="11" cy="27" r="1.5" fill="#D4A843" />
    </svg>
  );
}

function PicksIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#D4A843" strokeWidth="1.5" fill="none" />
      <path d="M13 21l4 4 10-10" stroke="#D4A843" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompeteIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#D4A843" strokeWidth="1.5" fill="none" />
      <path d="M14 26V18l6-5 6 5v8" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 26v-5h4v5" stroke="#D4A843" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 13v-2M24 14l1.5-1.5M16 14l-1.5-1.5" stroke="#D4A843" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default async function Home() {
  const { tournament, submissionCount, artistCount } = await getTournamentData();
  const isOpen = tournament?.status === 'open';

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HERO SECTION ===== */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center overflow-hidden">
        {/* Radial glow behind hero */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(212,168,67,0.15) 0%, transparent 70%)',
          }}
        />

        <p className="relative text-sm sm:text-base uppercase tracking-[0.3em] text-zinc-400 mb-4">
          That Jazz Show &bull; KRUI 89.7 FM
        </p>

        <h1 className="relative font-[family-name:var(--font-playfair)] text-5xl sm:text-7xl lg:text-8xl font-bold text-[#D4A843] leading-tight mb-6">
          Tournament
          <br />
          of Jazz
        </h1>

        <p className="relative max-w-xl text-zinc-400 text-lg sm:text-xl leading-relaxed mb-8">
          Welcome to the Speakeasy. 64 jazz legends enter. Only one will reign supreme.
        </p>

        {/* Art Deco Divider */}
        <div className="art-deco-divider w-48 sm:w-64 mb-10" aria-hidden="true">
          <span className="text-[#D4A843] text-lg">&loz;</span>
        </div>

        {/* CTAs */}
        {isOpen ? (
          <div className="relative flex flex-col items-center gap-4">
            <Link
              href="/play"
              className="gold-glow inline-block bg-[#D4A843] text-[#0A0A0A] font-semibold text-lg px-10 py-4 rounded-sm hover:bg-[#C49A3A] transition-colors tracking-wide"
            >
              Fill Out Your Bracket
            </Link>
            <Link
              href="/leaderboard"
              className="text-zinc-400 hover:text-[#D4A843] transition-colors text-sm tracking-wide underline underline-offset-4 decoration-zinc-700 hover:decoration-[#D4A843]"
            >
              View Leaderboard
            </Link>
          </div>
        ) : (
          <div className="relative">
            <p className="text-zinc-300 font-[family-name:var(--font-playfair)] text-2xl italic">
              {tournament ? statusLabel(tournament.status) : 'Coming Soon'}
            </p>
            {tournament && tournament.status !== 'setup' && (
              <Link
                href="/leaderboard"
                className="mt-4 inline-block text-zinc-400 hover:text-[#D4A843] transition-colors text-sm tracking-wide underline underline-offset-4 decoration-zinc-700 hover:decoration-[#D4A843]"
              >
                View Leaderboard
              </Link>
            )}
          </div>
        )}

        {/* Countdown Timer */}
        {tournament?.submission_deadline && isOpen && (
          <div className="mt-12">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500 mb-4">
              Submissions close in
            </p>
            <CountdownTimer deadline={tournament.submission_deadline} />
          </div>
        )}
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-center text-[#D4A843] mb-4">
            How It Works
          </h2>
          <div className="art-deco-divider w-32 mx-auto mb-14" aria-hidden="true">
            <span className="text-[#D4A843] text-sm">&loz;</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="gold-glow bg-[#1A1A1A] border border-[#D4A843]/20 rounded-sm p-8 flex flex-col items-center text-center">
              <ExploreIcon />
              <span className="text-[#D4A843] font-[family-name:var(--font-playfair)] text-sm tracking-widest uppercase mt-5 mb-2">
                Step 1
              </span>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-zinc-100 mb-3">
                Explore the Matchups
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Click into each matchup to read our host commentary, listen to featured tracks, and discover the legends.
              </p>
            </div>

            {/* Step 2 */}
            <div className="gold-glow bg-[#1A1A1A] border border-[#D4A843]/20 rounded-sm p-8 flex flex-col items-center text-center">
              <PicksIcon />
              <span className="text-[#D4A843] font-[family-name:var(--font-playfair)] text-sm tracking-widest uppercase mt-5 mb-2">
                Step 2
              </span>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-zinc-100 mb-3">
                Make Your Picks
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Choose winners across all 63 matchups. Add your own commentary explaining why.
              </p>
            </div>

            {/* Step 3 */}
            <div className="gold-glow bg-[#1A1A1A] border border-[#D4A843]/20 rounded-sm p-8 flex flex-col items-center text-center">
              <CompeteIcon />
              <span className="text-[#D4A843] font-[family-name:var(--font-playfair)] text-sm tracking-widest uppercase mt-5 mb-2">
                Step 3
              </span>
              <h3 className="font-[family-name:var(--font-playfair)] text-xl text-zinc-100 mb-3">
                Compete &amp; Share
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                See how your bracket stacks up as we reveal our picks live on the show.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== THE REGIONS ===== */}
      <section className="px-6 py-20 sm:py-28 bg-[#0F0F0F]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl text-center text-[#D4A843] mb-4">
            The Regions
          </h2>
          <div className="art-deco-divider w-32 mx-auto mb-14" aria-hidden="true">
            <span className="text-[#D4A843] text-sm">&loz;</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {REGIONS.map((region) => (
              <div
                key={region}
                className="gold-glow bg-[#1A1A1A] border-l-2 border-[#D4A843] rounded-sm p-8"
              >
                <h3 className="font-[family-name:var(--font-playfair)] text-2xl text-zinc-100 mb-1">
                  {REGION_LABELS[region]}
                </h3>
                <p className="text-[#D4A843] text-sm tracking-widest uppercase mb-4">
                  {REGION_SUBTITLES[region]}
                </p>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {REGION_DESCRIPTIONS[region]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      {tournament && (
        <section className="px-6 py-14 border-t border-b border-[#D4A843]/10">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-[#D4A843] font-[family-name:var(--font-playfair)] text-4xl font-bold">
                {submissionCount}
              </p>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mt-1">
                Brackets Submitted
              </p>
            </div>
            <div>
              <p className="text-[#D4A843] font-[family-name:var(--font-playfair)] text-4xl font-bold">
                {artistCount}
              </p>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mt-1">
                Jazz Legends
              </p>
            </div>
            <div>
              <p className="text-[#D4A843] font-[family-name:var(--font-playfair)] text-4xl font-bold">
                {statusLabel(tournament.status)}
              </p>
              <p className="text-zinc-500 text-sm uppercase tracking-widest mt-1">
                Tournament Status
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="mt-auto px-6 py-12 text-center">
        <div className="art-deco-divider w-32 mx-auto mb-8" aria-hidden="true">
          <span className="text-[#D4A843] text-sm">&loz;</span>
        </div>
        <p className="font-[family-name:var(--font-playfair)] text-[#D4A843] text-lg mb-2">
          Tournament of Jazz
        </p>
        <p className="text-zinc-500 text-sm mb-1">
          That Jazz Show on KRUI 89.7 FM
        </p>
        <p className="text-zinc-600 text-xs italic">
          Broadcasting from the Speakeasy Nightclub
        </p>
        <p className="text-zinc-700 text-xs mt-4">
          &copy; {new Date().getFullYear()} That Jazz Show
        </p>
      </footer>
    </div>
  );
}
