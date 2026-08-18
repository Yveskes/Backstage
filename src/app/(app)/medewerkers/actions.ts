"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/session";
import { isAdminEmail } from "@/lib/env";
import {
  joinName,
  sanitizeModules,
  splitName,
  type ModuleId,
  type UserKind,
} from "@/lib/permissions";

export type ProfileModules = {
  email: string;
  modules: ModuleId[];
};

export type DirectoryPerson = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  kind: UserKind;
  modules: ModuleId[];
  invitePending: boolean;
};

async function requireSessionEmail() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email?.toLowerCase() ?? "";
}

function parseKind(raw: unknown, email: string): UserKind {
  if (isAdminEmail(email)) {
    return "admin";
  }

  if (raw === "admin" || raw === "team" || raw === "staff") {
    return raw;
  }

  return "staff";
}

function namesFrom(row: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}) {
  const fullName = String(row.full_name ?? "").trim();
  const split = splitName(fullName);
  const firstName = String(row.first_name ?? "").trim() || split.firstName;
  const lastName = String(row.last_name ?? "").trim() || split.lastName;
  const email = String(row.email ?? "").trim().toLowerCase();

  return {
    firstName,
    lastName,
    fullName: joinName(firstName, lastName) || fullName || email,
    email,
  };
}

export async function loadDirectoryPeople(): Promise<DirectoryPerson[]> {
  const email = await requireSessionEmail();
  if (!email) {
    return [];
  }

  const admin = createAdminClient();
  const session = await createSessionClient();
  const client = admin ?? session;
  const { data: viewer } = await client
    .from("profiles")
    .select("user_kind, modules")
    .eq("email", email)
    .maybeSingle();
  const canSeeAll =
    isAdminEmail(email) ||
    viewer?.user_kind === "admin" ||
    viewer?.user_kind === "team" ||
    sanitizeModules(viewer?.modules).includes("medewerkers");

  let profileQuery = client
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, user_kind, modules");
  if (!canSeeAll) {
    profileQuery = profileQuery.eq("email", email);
  }

  const { data: profiles, error: profileError } = await profileQuery;
  const people = new Map<string, DirectoryPerson>();

  if (!profileError && profiles) {
    for (const row of profiles) {
      const names = namesFrom(row);
      if (!names.email) {
        continue;
      }

      people.set(names.email, {
        id: String(row.id),
        email: names.email,
        firstName: names.firstName,
        lastName: names.lastName,
        fullName: names.fullName,
        kind: parseKind(row.user_kind, names.email),
        modules: sanitizeModules(row.modules),
        invitePending: false,
      });
    }
  }

  if (canSeeAll) {
    const { data: invites } = await client
      .from("invites")
      .select("id, email, full_name, first_name, last_name, user_kind, status")
      .eq("status", "pending");

    for (const row of invites ?? []) {
      const names = namesFrom(row);
      if (!names.email || people.has(names.email)) {
        continue;
      }

      people.set(names.email, {
        id: `invite-${row.id}`,
        email: names.email,
        firstName: names.firstName,
        lastName: names.lastName,
        fullName: names.fullName,
        kind: parseKind(row.user_kind, names.email),
        modules: [],
        invitePending: true,
      });
    }
  }

  return [...people.values()];
}

export async function loadProfileModules(): Promise<ProfileModules[]> {
  const people = await loadDirectoryPeople();
  return people.map((person) => ({
    email: person.email,
    modules: person.modules,
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
