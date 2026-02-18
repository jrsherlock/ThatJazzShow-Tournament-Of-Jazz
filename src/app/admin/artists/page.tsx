import { createServerClient } from '@/lib/supabase';
import { Artist } from '@/lib/types';
import ArtistManager from '@/components/admin/ArtistManager';

export const dynamic = 'force-dynamic';

export default async function AdminArtistsPage() {
  const supabase = createServerClient();
  const { data: artists, error } = await supabase
    .from('artists')
    .select('*')
    .order('region')
    .order('seed');

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <p className="text-red-400">Failed to load artists: {error.message}</p>
      </div>
    );
  }

  return <ArtistManager initialArtists={(artists as Artist[]) || []} />;
}
