import { createServerClient } from '@/lib/supabase';
import { ThreatActor } from '@/lib/types';
import ThreatActorManager from '@/components/admin/ThreatActorManager';

export const dynamic = 'force-dynamic';

export default async function AdminThreatActorsPage() {
  const supabase = createServerClient();
  const { data: actors, error } = await supabase
    .from('threat_actors')
    .select('*')
    .order('region')
    .order('seed');

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-red-400">Failed to load threat actors: {error.message}</p>
      </div>
    );
  }

  return <ThreatActorManager initialActors={(actors as ThreatActor[]) || []} />;
}
