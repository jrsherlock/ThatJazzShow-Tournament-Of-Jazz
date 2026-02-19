import { createServerClient } from '@/lib/supabase';
import type { Artist, Tournament, MasterBracket } from '@/lib/types';
import { MasterBracketEditor } from '@/components/admin/MasterBracketEditor';

export default async function MasterBracketPage() {
  const supabase = createServerClient();

  const { data: tournament } = await supabase
    .from('tournament')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!tournament) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-accent">No Tournament Found</h2>
        <p className="text-muted mt-2">Create a tournament from the dashboard first.</p>
      </div>
    );
  }

  const { data: artists } = await supabase
    .from('artists')
    .select('*')
    .order('region')
    .order('seed');

  const { data: masterBracket } = await supabase
    .from('master_bracket')
    .select('*')
    .eq('tournament_id', tournament.id)
    .single();

  return (
    <div>
      <h1 className="text-3xl font-bold text-accent mb-2">Master Bracket</h1>
      <p className="text-muted mb-8">
        Set the correct answers for each matchup. This is the bracket participants will be scored against.
      </p>
      <MasterBracketEditor
        tournament={tournament as Tournament}
        artists={(artists ?? []) as Artist[]}
        existingBracket={masterBracket as MasterBracket | null}
      />
    </div>
  );
}
