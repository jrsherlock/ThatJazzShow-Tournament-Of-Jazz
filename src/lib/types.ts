export type Region = 'state_superpowers' | 'infrastructure_hunters' | 'cybercriminal_cartels' | 'shadow_market';

export interface MediaLink {
  type: 'video' | 'audio';
  url: string;
  title: string;
  source: string;
}

export interface ThreatActor {
  id: string;
  name: string;
  seed: number;
  region: Region;
  photo_url: string | null;
  bio: string | null;
  affiliation: string | null;
  country_flag: string | null;
  intel_report_url: string | null;
  notable_operations: string | null;
  media: MediaLink[] | null;
  created_at: string;
}

export type TournamentStatus = 'setup' | 'open' | 'closed' | 'revealing' | 'complete';

export interface Tournament {
  id: string;
  name: string;
  status: TournamentStatus;
  submission_deadline: string | null;
  created_at: string;
}

export interface MasterBracket {
  id: string;
  tournament_id: string;
  picks: Record<string, { winnerId: string }>;
  revealed_through: number;
  updated_at: string;
}

export interface MatchupPreview {
  id: string;
  tournament_id: string;
  matchup_key: string;
  headline: string | null;
  preview_text: string;
  fun_fact: string | null;
  created_at: string;
}

export interface Pick {
  winnerId: string;
  commentary?: string;
}

export interface Submission {
  id: string;
  tournament_id: string;
  display_name: string;
  access_token: string;
  picks: Record<string, Pick>;
  share_image_url: string | null;
  created_at: string;
}

// Bracket structure types
export interface Matchup {
  round: number;
  matchupIndex: number;
  actorA: ThreatActor | null;
  actorB: ThreatActor | null;
  winner: ThreatActor | null;
  region?: Region;
}

export interface BracketState {
  picks: Record<string, Pick>;
}

export interface ScoreResult {
  total: number;
  byRound: Record<number, number>;
  maxPossible: number;
  maxPossibleByRound: Record<number, number>;
}
