import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/session";

export const appDataKeys = {
  sponsors: "sponsors",
  staffPlanning: "staff_planning",
  social: "social",
  notifications: "notifications",
  usersRoster: "users_roster",
} as const;

export type AppDataKey = (typeof appDataKeys)[keyof typeof appDataKeys];

async function dataClient() {
  const admin = createAdminClient();
  if (admin) {
    return admin;
  }

  return createSessionClient();
}

export async function fetchAppDataPayload<T>(key: AppDataKey): Promise<T | null> {
  const client = await dataClient();
  const { data, error } = await client.from("app_data").select("payload").eq("key", key).maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data.payload as T) ?? null;
}

export async function upsertAppDataPayload(
  key: AppDataKey,
  payload: unknown,
): Promise<{ error?: string }> {
  const client = await dataClient();
  const { error } = await client.from("app_data").upsert(
    {
      key,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) {
    return {
      error:
        "Opslaan in de database is mislukt. Voer in Supabase het SQL-bestand 008_app_data.sql uit.",
    };
  }

  return {};
}
