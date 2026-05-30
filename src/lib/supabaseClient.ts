import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Falta VITE_SUPABASE_URL en el archivo .env");
}

if (!supabaseAnonKey) {
  throw new Error("Falta VITE_SUPABASE_ANON_KEY en el archivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);