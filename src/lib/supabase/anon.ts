import { createClient } from "@supabase/supabase-js";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export function createAnonClient() {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey());
}
