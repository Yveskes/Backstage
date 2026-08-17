import { createServerClient } from "./server";

export type ConnectionTestResult = {
  status: "ok" | "config_error" | "key_error" | "migration_pending" | "rls_blocked" | "error";
  message: string;
  festivals?: { id: string; name: string; year: number }[];
};

export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      status: "config_error",
      message: "NEXT_PUBLIC_SUPABASE_URL of NEXT_PUBLIC_SUPABASE_ANON_KEY ontbreekt in .env.local",
    };
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("festivals")
      .select("id, name, year")
      .limit(3);

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("invalid api key") || msg.includes("jwt")) {
        return {
          status: "key_error",
          message: "Supabase API key lijkt ongeldig. Controleer je anon key in Project Settings > API.",
        };
      }

      if (
        msg.includes("does not exist") ||
        msg.includes("could not find the table") ||
        error.code === "42P01" ||
        error.code === "PGRST205"
      ) {
        return {
          status: "migration_pending",
          message:
            "Verbinding OK, maar tabellen ontbreken. Voer supabase/migrations/001_initial_schema.sql uit in de SQL Editor.",
        };
      }

      if (
        msg.includes("permission denied") ||
        msg.includes("row-level security") ||
        error.code === "42501"
      ) {
        return {
          status: "rls_blocked",
          message:
            "Verbinding OK. RLS blokkeert anonieme reads (verwacht). Data is beschikbaar na login.",
        };
      }

      return {
        status: "error",
        message: error.message,
      };
    }

    return {
      status: "ok",
      message: `Verbinding OK — ${data?.length ?? 0} festival(s) gevonden.`,
      festivals: data ?? [],
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Onbekende fout bij Supabase-verbinding.",
    };
  }
}
