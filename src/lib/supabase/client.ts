import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return a mock client or handle gracefully if env vars are missing
  if (!supabaseUrl || !supabaseKey) {
    // During development/build, return a mock client with basic functionality
    // This prevents build errors while allowing the application to work when deployed
    return {
      auth: {
        signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
        signUp: async () => ({ error: new Error('Supabase not configured') })
      },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) })
      })
    } as any;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey
  );
}
