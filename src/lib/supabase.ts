import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Browser client (for client components — limited by RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client factory (for server components / API routes)
// Uses service role key to bypass RLS when available, falls back to anon key
export function createServerClient() {
  return createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
}
