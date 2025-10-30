// Supabase client wrapper
// This file provides an async getter that returns a Supabase client if
// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build time and
// `@supabase/supabase-js` is installed.

let cached: any = null;

export async function getSupabaseClient() {
  if (cached) return cached;

  const SUPABASE_URL = (import.meta.env.SUPABASE_URL as string) || null;
  const SUPABASE_KEY = (import.meta.env.SUPABASE_ANON_KEY as string) || null;

  if (!SUPABASE_URL || !SUPABASE_KEY) return null;

  try {
    // dynamic import so builds that don't install supabase won't fail until runtime
    const mod = await import("@supabase/supabase-js");
    const { createClient } = mod;
    const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      realtime: { params: { enable: true } },
    });
    cached = client;
    return client;
  } catch (err) {
    console.warn(
      "getSupabaseClient: failed to import or create Supabase client",
      err
    );
    return null;
  }
}
