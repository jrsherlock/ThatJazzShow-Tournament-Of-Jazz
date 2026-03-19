import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const actorId = formData.get('actorId') as string | null;

  if (!file || !actorId) {
    return NextResponse.json(
      { error: 'file and actorId are required' },
      { status: 400 }
    );
  }

  // Validate file type
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, and WebP images are allowed' },
      { status: 400 }
    );
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File must be under 5MB' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Look up threat actor to get name for filename
  const { data: actor, error: lookupErr } = await supabase
    .from('threat_actors')
    .select('name')
    .eq('id', actorId)
    .single();

  if (lookupErr || !actor) {
    return NextResponse.json({ error: 'Threat actor not found' }, { status: 404 });
  }

  // Generate slug from actor name
  const slug = actor.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const storagePath = `${slug}.${ext}`;

  // Upload to Supabase Storage (upsert)
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadErr } = await supabase.storage
    .from('artist-photos')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadErr) {
    return NextResponse.json(
      { error: `Upload failed: ${uploadErr.message}` },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('artist-photos')
    .getPublicUrl(storagePath);

  const publicUrl = urlData.publicUrl;

  // Update threat actor record
  const { error: updateErr } = await supabase
    .from('threat_actors')
    .update({ photo_url: publicUrl })
    .eq('id', actorId);

  if (updateErr) {
    return NextResponse.json(
      { error: `DB update failed: ${updateErr.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ photo_url: publicUrl });
}

export async function DELETE(request: NextRequest) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const actorId = searchParams.get('actorId');

  if (!actorId) {
    return NextResponse.json(
      { error: 'actorId is required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Clear photo_url in the database
  const { error: updateErr } = await supabase
    .from('threat_actors')
    .update({ photo_url: null })
    .eq('id', actorId);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
