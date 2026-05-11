import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Ramune Catcher] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n" +
    "In Netlify: Site settings → Environment variables → add both keys, then redeploy.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
);

export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
