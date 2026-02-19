import { ImageResponse } from 'next/og';
import { createServerClient } from '@/lib/supabase';
import { scoreSubmission } from '@/lib/scoring';
import type { Artist, Submission, MasterBracket } from '@/lib/types';
import { matchupKey } from '@/lib/bracket-utils';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  const { accessToken } = await params;
  const supabase = createServerClient();

  // Fetch submission
  const { data: submission } = await supabase
    .from('submissions')
    .select('*')
    .eq('access_token', accessToken)
    .single();

  if (!submission) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0A',
            color: '#0B3D91',
            fontSize: 48,
            fontFamily: 'serif',
          }}
        >
          Bracket Not Found
        </div>
      ),
      { ...size }
    );
  }

  const typedSubmission = submission as Submission;

  // Fetch artists and master bracket in parallel
  const [artistsResult, masterBracketResult] = await Promise.all([
    supabase.from('artists').select('*').order('seed', { ascending: true }),
    supabase
      .from('master_bracket')
      .select('*')
      .eq('tournament_id', typedSubmission.tournament_id)
      .single(),
  ]);

  const artists = (artistsResult.data as Artist[]) ?? [];
  const masterBracket = masterBracketResult.data as MasterBracket | null;

  // Resolve Final Four artists (the 4 artists competing in round 5)
  const finalFourNames: string[] = [];
  for (let i = 0; i < 2; i++) {
    // Each round 5 matchup has two feeder matchups from round 4
    const parentAKey = matchupKey(4, i * 2);
    const parentBKey = matchupKey(4, i * 2 + 1);
    const pickA = typedSubmission.picks[parentAKey];
    const pickB = typedSubmission.picks[parentBKey];

    if (pickA) {
      const artist = artists.find((a) => a.id === pickA.winnerId);
      if (artist) finalFourNames.push(artist.name);
    }
    if (pickB) {
      const artist = artists.find((a) => a.id === pickB.winnerId);
      if (artist) finalFourNames.push(artist.name);
    }
  }

  // Resolve champion
  const championPick = typedSubmission.picks[matchupKey(6, 0)];
  const champion = championPick
    ? artists.find((a) => a.id === championPick.winnerId)
    : null;
  const championName = champion?.name ?? 'TBD';

  // Compute score if revealed
  let scoreText: string | null = null;
  if (masterBracket && masterBracket.revealed_through > 0) {
    const scoreResult = scoreSubmission(
      typedSubmission.picks,
      masterBracket.picks,
      masterBracket.revealed_through
    );
    scoreText = `Score: ${scoreResult.total} / ${scoreResult.maxPossible}`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0A0A0A',
          padding: '3px',
        }}
      >
        {/* Gold border wrapper */}
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #0B3D91',
            borderRadius: '12px',
            padding: '40px 50px',
            position: 'relative',
          }}
        >
          {/* Header section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#0B3D91',
                fontFamily: 'serif',
                letterSpacing: '1px',
              }}
            >
              Tournament of Jazz
            </div>
            <div
              style={{
                fontSize: 14,
                color: '#888888',
                marginTop: '4px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              That Jazz Show on KRUI 89.7 FM
            </div>
          </div>

          {/* Gold divider */}
          <div
            style={{
              width: '100%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #0B3D91, transparent)',
              marginBottom: '20px',
            }}
          />

          {/* Display name */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '6px',
            }}
          >
            <div
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: '#FFFFFF',
                fontFamily: 'serif',
              }}
            >
              {typedSubmission.display_name}
            </div>
          </div>

          {/* Score (if available) */}
          {scoreText && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  fontSize: 20,
                  color: '#0B3D91',
                  fontWeight: 600,
                  backgroundColor: 'rgba(11, 61, 145, 0.1)',
                  padding: '6px 24px',
                  borderRadius: '8px',
                  border: '1px solid rgba(11, 61, 145, 0.3)',
                }}
              >
                {scoreText}
              </div>
            </div>
          )}

          {/* Champion section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                marginBottom: '8px',
              }}
            >
              Champion
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#1A1A1A',
                border: '2px solid #D4A843',
                borderRadius: '10px',
                padding: '12px 40px',
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#D4A843',
                  fontFamily: 'serif',
                }}
              >
                {championName}
              </div>
            </div>
          </div>

          {/* Final Four section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#888888',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                marginBottom: '12px',
              }}
            >
              Final Four
            </div>
            <div
              style={{
                display: 'flex',
                gap: '16px',
                justifyContent: 'center',
              }}
            >
              {finalFourNames.slice(0, 4).map((name, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1A1A1A',
                    border: '1px solid rgba(11, 61, 145, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    minWidth: '200px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#E0E0E0',
                      textAlign: 'center',
                    }}
                  >
                    {name}
                  </div>
                </div>
              ))}
              {/* Fill remaining slots if fewer than 4 */}
              {Array.from({ length: Math.max(0, 4 - finalFourNames.length) }).map(
                (_, i) => (
                  <div
                    key={`empty-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#1A1A1A',
                      border: '1px solid rgba(11, 61, 145, 0.15)',
                      borderRadius: '8px',
                      padding: '10px 20px',
                      minWidth: '200px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        color: '#555555',
                        fontStyle: 'italic',
                      }}
                    >
                      TBD
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Bottom decorative line */}
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              bottom: '20px',
              left: '50px',
              right: '50px',
              height: '1px',
              background:
                'linear-gradient(90deg, transparent, #0B3D91, transparent)',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
