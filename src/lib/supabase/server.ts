import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Every table has RLS enabled with no policies, so only the service-role key
 * can read/write anything. That key must never reach the browser bundle —
 * `server-only` makes any accidental client-component import a build error.
 */
export function createSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY is not set. Fill in .env before using Supabase-backed pages.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
