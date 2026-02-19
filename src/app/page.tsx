import Link from 'next/link';
import { createServerClient } from '@/lib/supabase';
import { REGIONS, REGION_LABELS, REGION_SUBTITLES, REGION_COLORS } from '@/lib/constants';
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
      <circle cx="20" cy="20" r="18" stroke="#0B3D91" strokeWidth="1.5" fill="none" />
      <path d="M15 13h10M15 20h10M15 27h7" stroke="#0B3D91" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11" cy="13" r="1.5" fill="#0B3D91" />
      <circle cx="11" cy="20" r="1.5" fill="#0B3D91" />
      <circle cx="11" cy="27" r="1.5" fill="#0B3D91" />
    </svg>
  );
}

function PicksIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#0B3D91" strokeWidth="1.5" fill="none" />
      <path d="M13 21l4 4 10-10" stroke="#0B3D91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CompeteIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="20" cy="20" r="18" stroke="#0B3D91" strokeWidth="1.5" fill="none" />
      <path d="M14 26V18l6-5 6 5v8" stroke="#0B3D91" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 26v-5h4v5" stroke="#0B3D91" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 13v-2M24 14l1.5-1.5M16 14l-1.5-1.5" stroke="#0B3D91" strokeWidth="1.2" strokeLinecap="round" />
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
        {/* Asymmetric cobalt color block — Blue Note cover composition */}
        <div
          className="pointer-events-none absolute -top-20 -right-20 w-[500px] h-[700px] opacity-[0.07]"
          style={{ background: '#0B3D91' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 -left-10 w-[300px] h-[200px] opacity-[0.05]"
          style={{ background: '#34B1E4' }}
        />

        <p className="relative text-sm sm:text-base uppercase tracking-[0.3em] text-muted mb-4">
          As Heard on 89.7 KRUI-FM
        </p>

        <h1 className="relative font-display text-5xl sm:text-7xl lg:text-8xl font-bold text-foreground leading-none mb-4">
          Tournament
          <br />
          <span className="text-accent">of Jazz</span>
        </h1>

        {/* Blue Note modernist rule */}
        <div className="w-16 h-1 bg-accent mx-auto mb-8" aria-hidden="true" />

        <p className="relative max-w-xl text-muted text-lg sm:text-xl leading-relaxed mb-8">
          64 jazz legends. One champion. Make your picks.
        </p>

        {/* CTAs */}
        {isOpen ? (
          <div className="relative flex flex-col items-center gap-4">
            <Link
              href="/play"
              className="accent-glow inline-block bg-accent text-white font-display text-lg px-10 py-4 rounded-sm hover:bg-accent-light transition-colors tracking-wide uppercase"
            >
              Fill Out Your Bracket
            </Link>
            <Link
              href="/leaderboard"
              className="text-muted hover:text-accent transition-colors text-sm tracking-wide underline underline-offset-4 decoration-subtle hover:decoration-accent"
            >
              View Leaderboard
            </Link>
          </div>
        ) : (
          <div className="relative">
            <p className="text-foreground font-display text-2xl uppercase">
              {tournament ? statusLabel(tournament.status) : 'Coming Soon'}
            </p>
            {tournament && tournament.status !== 'setup' && (
              <Link
                href="/leaderboard"
                className="mt-4 inline-block text-muted hover:text-accent transition-colors text-sm tracking-wide underline underline-offset-4 decoration-subtle hover:decoration-accent"
              >
                View Leaderboard
              </Link>
            )}
          </div>
        )}

        {/* Countdown Timer */}
        {tournament?.submission_deadline && isOpen && (
          <div className="mt-12">
            <p className="text-xs uppercase tracking-[0.25em] text-dim mb-4">
              Submissions close in
            </p>
            <CountdownTimer deadline={tournament.submission_deadline} />
          </div>
        )}
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl text-center text-accent mb-4">
            How It Works
          </h2>
          <div className="w-10 h-1 bg-accent mx-auto mb-14" aria-hidden="true" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="accent-glow bg-surface-hover border border-accent/20 rounded-sm p-8 flex flex-col items-center text-center">
              <ExploreIcon />
              <span className="text-accent font-display text-sm tracking-widest uppercase mt-5 mb-2">
                Step 1
              </span>
              <h3 className="font-display text-xl text-foreground mb-3">
                Explore the Matchups
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Click into each matchup to read our host commentary, listen to featured tracks, and discover the legends.
              </p>
            </div>

            {/* Step 2 */}
            <div className="accent-glow bg-surface-hover border border-accent/20 rounded-sm p-8 flex flex-col items-center text-center">
              <PicksIcon />
              <span className="text-accent font-display text-sm tracking-widest uppercase mt-5 mb-2">
                Step 2
              </span>
              <h3 className="font-display text-xl text-foreground mb-3">
                Make Your Picks
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                Choose winners across all 63 matchups. Add your own commentary explaining why.
              </p>
            </div>

            {/* Step 3 */}
            <div className="accent-glow bg-surface-hover border border-accent/20 rounded-sm p-8 flex flex-col items-center text-center">
              <CompeteIcon />
              <span className="text-accent font-display text-sm tracking-widest uppercase mt-5 mb-2">
                Step 3
              </span>
              <h3 className="font-display text-xl text-foreground mb-3">
                Compete &amp; Share
              </h3>
              <p className="text-muted text-sm leading-relaxed">
                See how your bracket stacks up as we reveal our picks live on the show.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== THE REGIONS ===== */}
      <section className="px-6 py-20 sm:py-28 bg-surface">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl text-center text-accent mb-4">
            The Regions
          </h2>
          <div className="w-10 h-1 bg-accent mx-auto mb-14" aria-hidden="true" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {REGIONS.map((region) => {
              const colors = REGION_COLORS[region];
              return (
                <div
                  key={region}
                  className="region-glow rounded-sm p-8 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}26, ${colors.primary}08)`,
                    borderLeft: `3px solid ${colors.primary}`,
                    '--region-glow': `${colors.primary}33`,
                  } as React.CSSProperties}
                >
                  <h3 className="font-display text-2xl text-foreground mb-1">
                    {REGION_LABELS[region]}
                  </h3>
                  <p
                    className="text-sm tracking-widest uppercase mb-4"
                    style={{ color: colors.light }}
                  >
                    {REGION_SUBTITLES[region]}
                  </p>
                  <p className="text-muted text-sm leading-relaxed">
                    {REGION_DESCRIPTIONS[region]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      {tournament && (
        <section className="px-6 py-14 border-t border-b border-accent/10">
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-accent font-display text-4xl font-bold">
                {submissionCount}
              </p>
              <p className="text-dim text-sm uppercase tracking-widest mt-1">
                Brackets Submitted
              </p>
            </div>
            <div>
              <p className="text-accent font-display text-4xl font-bold">
                {artistCount}
              </p>
              <p className="text-dim text-sm uppercase tracking-widest mt-1">
                Jazz Legends
              </p>
            </div>
            <div>
              <p className="text-accent font-display text-4xl font-bold">
                {statusLabel(tournament.status)}
              </p>
              <p className="text-dim text-sm uppercase tracking-widest mt-1">
                Tournament Status
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ===== FOOTER ===== */}
      <footer className="mt-auto px-6 py-12 text-center">
        <div className="w-10 h-1 bg-accent mx-auto mb-8" aria-hidden="true" />
        <p className="font-display text-accent text-lg mb-2 uppercase tracking-wide">
          Tournament of Jazz
        </p>
        <p className="text-dim text-sm mb-1">
          Presented by That Jazz Show on KRUI 89.7 FM
        </p>
        <p className="text-muted text-xs mt-4">
          &copy; {new Date().getFullYear()} That Jazz Show
        </p>
      </footer>
    </div>
  );
}
