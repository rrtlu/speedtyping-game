import { createClient } from "@supabase/supabase-js";

// Values come from .env.local (see .env.example). Only the publishable /
// anon key belongs here - never the secret / service_role key.
const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// createClient("") throws, so build the client only when both values exist.
// The game still runs offline; the leaderboard commands report the issue.
export const db = URL && KEY ? createClient(URL, KEY) : null;

if (!db) {
  console.error(
    "Supabase is not configured. Copy .env.example to .env.local and set " +
    "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the dev server."
  );
}
