"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/session";
import { isAdminEmail } from "@/lib/env";
import { sanitizeModules, type ModuleId } from "@/lib/permissions";

export type ProfileModules = {
  email: string;
  modules: ModuleId[];
};

async function requireSessionEmail() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() ?? "";
}

export async function loadProfileModules(): Promise<ProfileModules[]> {
  const email = await requireSessionEmail();
  if (!email) {
    return [];
  }

  const admin = createAdminClient();
  const session = await createSessionClient();
  const client = admin ?? session;
  const adminViewer = isAdminEmail(email);

  let query = client.from("profiles").select("email, modules");
  if (!adminViewer) {
    query = query.eq("email", email);
  }

  const { data, error } = await query;
  if (error || !data) {
    return [];
  }

  return data
    .filter((row) => typeof row.email === "string" && row.email)
    .map((row) => ({
      email: String(row.email).toLowerCase(),
      modules: sanitizeModules(row.modules),
    }));
}

export async function saveUserModules(
  email: string,
  modules: ModuleId[],
): Promise<{ error?: string }> {
  const actorEmail = await requireSessionEmail();
  if (!actorEmail || !isAdminEmail(actorEmail)) {
    return { error: "Alleen admin kan onderdelen opslaan." };
  }

  const target = email.trim().toLowerCase();
  if (!target) {
    return { error: "Deze persoon heeft geen e-mailadres." };
  }

  const clean = sanitizeModules(modules);
  const admin = createAdminClient();
  const session = await createSessionClient();
  const client = admin ?? session;

  const { error } = await client
    .from("profiles")
    .update({ modules: clean, updated_at: new Date().toISOString() })
    .eq("email", target);

  if (error) {
    return {
      error:
        "Opslaan in de database is mislukt. Voer in Supabase het SQL-bestand 005_profile_modules.sql uit.",
    };
  }

  return {};
}
