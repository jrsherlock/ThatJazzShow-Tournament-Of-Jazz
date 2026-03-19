import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';

export async function GET() {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('threat_actors')
    .select('*')
    .order('region')
    .order('seed');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    seed,
    region,
    bio,
    affiliation,
    country_flag,
    intel_report_url,
    notable_operations,
    media,
  } = body;

  if (!name || !seed || !region) {
    return NextResponse.json(
      { error: 'name, seed, and region are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('threat_actors')
    .insert({
      name,
      seed,
      region,
      bio: bio || null,
      affiliation: affiliation || null,
      country_flag: country_flag || null,
      intel_report_url: intel_report_url || null,
      notable_operations: notable_operations || null,
      media: media && media.length > 0 ? media : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    id,
    name,
    seed,
    region,
    bio,
    affiliation,
    country_flag,
    intel_report_url,
    notable_operations,
    media,
  } = body;

  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('threat_actors')
    .update({
      name,
      seed,
      region,
      bio: bio || null,
      affiliation: affiliation || null,
      country_flag: country_flag || null,
      intel_report_url: intel_report_url || null,
      notable_operations: notable_operations || null,
      media: media && media.length > 0 ? media : null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from('threat_actors')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
