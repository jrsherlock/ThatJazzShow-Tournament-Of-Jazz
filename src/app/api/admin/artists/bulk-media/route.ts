import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';
import type { MediaLink } from '@/lib/types';

interface BulkMediaEntry {
  artist_name: string;
  media: MediaLink[];
}

export async function POST(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: BulkMediaEntry[] = await request.json();

  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json(
      { error: 'Expected a non-empty array of { artist_name, media }' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Fetch all artists to match by name
  const { data: artists, error: fetchErr } = await supabase
    .from('artists')
    .select('id, name');

  if (fetchErr || !artists) {
    return NextResponse.json({ error: fetchErr?.message || 'Failed to fetch artists' }, { status: 500 });
  }

  const nameToId = new Map<string, string>();
  for (const a of artists) {
    nameToId.set(a.name.toLowerCase(), a.id);
  }

  let updated = 0;
  const notFound: string[] = [];
  const errors: string[] = [];

  for (const entry of body) {
    const id = nameToId.get(entry.artist_name.toLowerCase());
    if (!id) {
      notFound.push(entry.artist_name);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('artists')
      .update({ media: entry.media.length > 0 ? entry.media : null })
      .eq('id', id);

    if (updateErr) {
      errors.push(`${entry.artist_name}: ${updateErr.message}`);
    } else {
      updated++;
    }
  }

  return NextResponse.json({
    updated,
    not_found: notFound,
    errors,
    total: body.length,
  });
}
