import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const url =
  import.meta.env.VITE_SUPABASE_URL?.trim() ||
  "https://placeholder.supabase.co";
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "public-anon-key";

export const supabase = createClient<Database>(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
