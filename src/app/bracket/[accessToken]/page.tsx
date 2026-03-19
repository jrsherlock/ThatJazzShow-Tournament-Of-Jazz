import { createServerClient } from '@/lib/supabase';
import { scoreSubmission } from '@/lib/scoring';
import type { ThreatActor, Submission, MasterBracket, Tournament } from '@/lib/types';
import type { Metadata } from 'next';
import { BracketViewer } from '@/components/bracket/BracketViewer';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ accessToken: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { accessToken } = await params;
  const supabase = createServerClient();

  const { data: submission } = await supabase
    .from('submissions')
    .select('display_name')
    .eq('access_token', accessToken)
    .single();

  const displayName = submission?.display_name ?? 'A Participant';

  return {
    title: `${displayName}'s Bracket | Tournament of Threats`,
    description: `Check out ${displayName}'s picks for the Tournament of Threats.`,
    openGraph: {
      title: `${displayName}'s Bracket | Tournament of Threats`,
      description: `Check out ${displayName}'s picks for the Tournament of Threats.`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName}'s Bracket | Tournament of Threats`,
      description: `Check out ${displayName}'s picks for the Tournament of Threats.`,
    },
  };
}

export default async function BracketPage({ params }: PageProps) {
  const { accessToken } = await params;
  const supabase = createServerClient();

  // Fetch the submission by access token
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .select('*')
    .eq('access_token', accessToken)
    .single();

  if (submissionError || !submission) {
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
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-semibold text-accent mb-3">
            Bracket Not Found
          </h1>
          <p className="text-muted text-sm leading-relaxed mb-6">
            This bracket link is invalid or has been removed. Double-check the URL and try again.
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

  const typedSubmission = submission as Submission;

  // Fetch all threat actors, latest tournament, and master bracket in parallel
  const [actorsResult, tournamentResult, masterBracketResult] = await Promise.all([
    supabase
      .from('threat_actors')
      .select('*')
      .order('seed', { ascending: true }),
    supabase
      .from('tournament')
      .select('*')
      .eq('id', typedSubmission.tournament_id)
      .single(),
    supabase
      .from('master_bracket')
      .select('*')
      .eq('tournament_id', typedSubmission.tournament_id)
      .single(),
  ]);

  const typedActors = (actorsResult.data as ThreatActor[]) ?? [];
  const typedTournament = tournamentResult.data as Tournament;
  const typedMasterBracket = masterBracketResult.data as MasterBracket | null;

  // Fallback tournament if not found (shouldn't happen but guard against it)
  const tournament: Tournament = typedTournament ?? {
    id: typedSubmission.tournament_id,
    name: 'Tournament of Threats',
    status: 'open' as const,
    submission_deadline: null,
    created_at: typedSubmission.created_at,
  };

  // Compute score if master bracket has revealed rounds
  const score =
    typedMasterBracket && typedMasterBracket.revealed_through > 0
      ? scoreSubmission(
          typedSubmission.picks,
          typedMasterBracket.picks,
          typedMasterBracket.revealed_through
        )
      : null;

  const bracketUrl = `/bracket/${accessToken}`;

  return (
    <BracketViewer
      submission={typedSubmission}
      actors={typedActors}
      masterBracket={typedMasterBracket}
      tournament={tournament}
      score={score}
      bracketUrl={bracketUrl}
    />
  );
}
