import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/env";

export function createBrowserClient() {
  return createSupabaseBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
