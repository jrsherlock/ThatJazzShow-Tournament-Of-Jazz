import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';
import type { MediaLink } from '@/lib/types';

interface BulkMediaEntry {
  actor_name: string;
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
      { error: 'Expected a non-empty array of { actor_name, media }' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Fetch all threat actors to match by name
  const { data: actors, error: fetchErr } = await supabase
    .from('threat_actors')
    .select('id, name');

  if (fetchErr || !actors) {
    return NextResponse.json({ error: fetchErr?.message || 'Failed to fetch threat actors' }, { status: 500 });
  }

  const nameToId = new Map<string, string>();
  for (const a of actors) {
    nameToId.set(a.name.toLowerCase(), a.id);
  }

  let updated = 0;
  const notFound: string[] = [];
  const errors: string[] = [];

  for (const entry of body) {
    const id = nameToId.get(entry.actor_name.toLowerCase());
    if (!id) {
      notFound.push(entry.actor_name);
      continue;
    }

    const { error: updateErr } = await supabase
      .from('threat_actors')
      .update({ media: entry.media.length > 0 ? entry.media : null })
      .eq('id', id);

    if (updateErr) {
      errors.push(`${entry.actor_name}: ${updateErr.message}`);
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
