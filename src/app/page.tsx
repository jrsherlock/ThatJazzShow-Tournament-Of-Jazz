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
/*  "As Heard On" retro radio badge (à la "As Seen on TV")             */
/* ------------------------------------------------------------------ */
function AsHeardOnBadge() {
  return (
    <svg
      width="120"
      height="130"
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="As heard on KRUI 89.7 FM"
      className="w-[90px] h-[98px] sm:w-[120px] sm:h-[130px] drop-shadow-lg"
      style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' }}
    >
      {/* Antenna */}
      <line x1="60" y1="28" x2="44" y2="6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="28" x2="76" y2="6" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Antenna tips */}
      <circle cx="44" cy="6" r="3" fill="white" />
      <circle cx="76" cy="6" r="3" fill="white" />

      {/* Radio waves from left antenna */}
      <path d="M36 10a12 12 0 0 1-4-8" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M32 12a18 18 0 0 1-6-12" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />

      {/* Radio waves from right antenna */}
      <path d="M84 10a12 12 0 0 0 4-8" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.6" />
      <path d="M88 12a18 18 0 0 0 6-12" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />

      {/* Outer border — rounded TV/radio shape */}
      <rect x="8" y="24" width="104" height="84" rx="12" fill="white" />

      {/* Inner red screen */}
      <rect x="14" y="30" width="92" height="72" rx="8" fill="#E53E3E" />

      {/* "AS HEARD ON" text */}
      <text
        x="60"
        y="50"
        textAnchor="middle"
        fill="white"
        fontFamily="'Inter', 'Helvetica Neue', sans-serif"
        fontWeight="800"
        fontSize="11"
        letterSpacing="0.1em"
      >
        AS HEARD ON
      </text>

      {/* "KRUI" — large bold text */}
      <text
        x="60"
        y="78"
        textAnchor="middle"
        fill="white"
        fontFamily="'Bebas Neue', 'Impact', sans-serif"
        fontWeight="700"
        fontSize="36"
        letterSpacing="0.04em"
      >
        KRUI
      </text>

      {/* "89.7 FM" subtitle */}
      <text
        x="60"
        y="95"
        textAnchor="middle"
        fill="white"
        fontFamily="'Inter', 'Helvetica Neue', sans-serif"
        fontWeight="700"
        fontSize="11"
        letterSpacing="0.05em"
      >
        89.7 FM
      </text>

      {/* Feet */}
      <rect x="36" y="108" width="8" height="6" rx="2" fill="white" />
      <rect x="76" y="108" width="8" height="6" rx="2" fill="white" />
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
      <section className="relative flex flex-col items-center justify-center text-center overflow-hidden min-h-[90vh] sm:min-h-[85vh]">
        {/* Speakeasy image — full-bleed with cinematic reveal */}
        <div className="absolute inset-0 hero-image-reveal overflow-hidden">
          <img
            src="/images/805-melrose.png"
            alt="The speakeasy at 805 Melrose — home of That Jazz Show"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Dark gradient overlay — heavier at bottom for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(
                to bottom,
                rgba(0,0,0,0.35) 0%,
                rgba(0,0,0,0.15) 30%,
                rgba(0,0,0,0.40) 60%,
                rgba(0,0,0,0.82) 100%
              )`,
            }}
          />
          {/* Cobalt tint overlay — ties image into site palette */}
          <div
            className="absolute inset-0 mix-blend-overlay opacity-25"
            style={{ background: 'linear-gradient(135deg, #0B3D91, transparent 60%)' }}
          />
          {/* Vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
            }}
          />
        </div>

        {/* "As Heard on" badge — retro radio style, top-right */}
        <div
          className="hero-fade-up absolute top-4 right-4 sm:top-6 sm:right-6 z-20"
          style={{ animationDelay: '0.5s' }}
        >
          <AsHeardOnBadge />
        </div>

        {/* Content — layered above image */}
        <div className="relative z-10 px-6 pt-32 pb-24 sm:pt-40 sm:pb-32 flex flex-col items-center">
          <p
            className="hero-fade-up font-display text-2xl sm:text-3xl lg:text-4xl uppercase tracking-[0.15em] text-white/90 mb-3"
            style={{ animationDelay: '0.6s' }}
          >
            That Jazz Show
          </p>
          <p
            className="hero-fade-up text-xs sm:text-sm uppercase tracking-[0.25em] text-white/40 mb-6"
            style={{ animationDelay: '0.75s' }}
          >
            presents
          </p>

          <h1
            className="hero-fade-up font-display text-5xl sm:text-7xl lg:text-8xl font-bold text-white leading-none mb-2"
            style={{ animationDelay: '0.9s' }}
          >
            Tournament
          </h1>
          <h1
            className="hero-fade-up font-display text-5xl sm:text-7xl lg:text-8xl font-bold leading-none mb-6"
            style={{ animationDelay: '1.1s', color: '#5DADE2' }}
          >
            of Jazz
          </h1>

          {/* Blue Note modernist rule */}
          <div
            className="hero-rule-expand h-1 bg-white/60 mx-auto mb-8"
            style={{ animationDelay: '1.4s' }}
            aria-hidden="true"
          />

          <p
            className="hero-fade-up max-w-2xl text-white/80 text-lg sm:text-xl leading-relaxed mb-10"
            style={{ animationDelay: '1.5s' }}
          >
            64 jazz legends. One champion. Make your picks.
          </p>

          {/* CTAs */}
          {isOpen ? (
            <div
              className="hero-fade-up flex flex-col items-center gap-4"
              style={{ animationDelay: '1.8s' }}
            >
              <Link
                href="/play"
                className="inline-block bg-white/95 text-[#0B3D91] font-display text-lg px-10 py-4 rounded-sm hover:bg-white transition-colors tracking-wide uppercase shadow-lg shadow-black/30"
              >
                Fill Out Your Bracket
              </Link>
              <Link
                href="/leaderboard"
                className="text-white/60 hover:text-white transition-colors text-sm tracking-wide underline underline-offset-4 decoration-white/30 hover:decoration-white/70"
              >
                View Leaderboard
              </Link>
            </div>
          ) : (
            <div
              className="hero-fade-up"
              style={{ animationDelay: '1.8s' }}
            >
              <p className="text-white font-display text-2xl uppercase">
                {tournament ? statusLabel(tournament.status) : 'Coming Soon'}
              </p>
              {tournament && tournament.status !== 'setup' && (
                <Link
                  href="/leaderboard"
                  className="mt-4 inline-block text-white/60 hover:text-white transition-colors text-sm tracking-wide underline underline-offset-4 decoration-white/30 hover:decoration-white/70"
                >
                  View Leaderboard
                </Link>
              )}
            </div>
          )}

          {/* Countdown Timer */}
          {tournament?.submission_deadline && isOpen && (
            <div
              className="hero-fade-up mt-14"
              style={{ animationDelay: '2.1s' }}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-white/50 mb-4">
                Submissions close in
              </p>
              <CountdownTimer deadline={tournament.submission_deadline} />
            </div>
          )}
        </div>

        {/* Bottom fade into page background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-24 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, var(--background))',
          }}
        />
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
