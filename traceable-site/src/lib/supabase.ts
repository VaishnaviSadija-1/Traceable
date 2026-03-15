/**
 * Supabase client factory for Traceable.
 *
 * - `supabase`      — anon key client (safe for use in client components or
 *                     server routes that respect RLS).
 * - `supabaseAdmin` — service-role client that bypasses RLS.
 *                     NEVER expose this to the browser. Only import in
 *                     server-side code (API routes, Server Actions).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  throw new Error('Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Public / anon client — respects Row Level Security
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // API routes are stateless
    autoRefreshToken: false,
  },
});

// Server-side admin client — bypasses RLS
// Guard the instantiation so importing this module in a browser bundle
// throws loudly rather than leaking the key silently.
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseServiceRoleKey) {
    throw new Error('Missing env: SUPABASE_SERVICE_ROLE_KEY — this client is server-only');
  }
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _supabaseAdmin;
}

/**
 * Convenience export. Only call this in server-side code.
 * Usage: `import { supabaseAdmin } from '@/lib/supabase'`
 */
export const supabaseAdmin: SupabaseClient = (() => {
  // During module evaluation in a server context the key should be present.
  // In client bundles this will throw — intentionally.
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin must not be imported in client-side code');
  }
  return getSupabaseAdmin();
})();
