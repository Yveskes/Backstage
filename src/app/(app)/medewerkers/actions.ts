"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/session";
import { isAdminEmail } from "@/lib/env";
import {
  isUsablePersonName,
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
  const email = String(row.email ?? "").trim().toLowerCase();
  const fullName = String(row.full_name ?? "").trim();
  const split = splitName(fullName);
  const firstName = isUsablePersonName(String(row.first_name ?? ""), email)
    ? String(row.first_name).trim()
    : isUsablePersonName(split.firstName, email)
      ? split.firstName
      : isAdminEmail(email)
        ? "Yves"
        : "";
  const lastName = isUsablePersonName(String(row.last_name ?? ""), email)
    ? String(row.last_name).trim()
    : isUsablePersonName(split.lastName, email)
      ? split.lastName
      : isAdminEmail(email)
        ? "Moreel"
        : "";

  return {
    firstName,
    lastName,
    fullName: joinName(firstName, lastName) || (isUsablePersonName(fullName, email) ? fullName : ""),
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
  const repairEmails = new Set<string>();

  if (!profileError && profiles) {
    for (const row of profiles) {
      const names = namesFrom(row);
      if (!names.email) {
        continue;
      }

      const storedFirst = String(row.first_name ?? "").trim();
      const storedFull = String(row.full_name ?? "").trim();
      if (
        isAdminEmail(names.email) &&
        (!isUsablePersonName(storedFirst, names.email) ||
          !isUsablePersonName(storedFull, names.email) ||
          row.user_kind !== "admin")
      ) {
        repairEmails.add(names.email);
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

  await repairAdminProfileNames(client, people, repairEmails);
  return [...people.values()];
}

async function repairAdminProfileNames(
  client: NonNullable<ReturnType<typeof createAdminClient>> | Awaited<ReturnType<typeof createSessionClient>>,
  people: Map<string, DirectoryPerson>,
  emails: Set<string>,
) {
  for (const email of emails) {
    const person = people.get(email);
    if (!person) {
      continue;
    }

    person.firstName = person.firstName || "Yves";
    person.lastName = person.lastName || "Moreel";
    person.fullName = joinName(person.firstName, person.lastName);
    person.kind = "admin";

    await client
      .from("profiles")
      .update({
        first_name: person.firstName,
        last_name: person.lastName,
        full_name: person.fullName,
        user_kind: "admin",
        updated_at: new Date().toISOString(),
      })
      .eq("email", person.email);
  }
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function deleteDirectoryPerson(email: string): Promise<{ error?: string }> {
  const actorEmail = await requireSessionEmail();
  if (!actorEmail) {
    return { error: "Je bent niet ingelogd." };
  }

  const target = email.trim().toLowerCase();
  if (!target) {
    return { error: "Deze persoon heeft geen e-mailadres." };
  }

  if (target === actorEmail) {
    return { error: "Je kunt jezelf niet verwijderen." };
  }

  const admin = createAdminClient();
  const session = await createSessionClient();
  const client = admin ?? session;
  const { data: viewer } = await client
    .from("profiles")
    .select("user_kind, modules")
    .eq("email", actorEmail)
    .maybeSingle();
  const canManage =
    isAdminEmail(actorEmail) ||
    viewer?.user_kind === "admin" ||
    sanitizeModules(viewer?.modules).includes("medewerkers");

  if (!canManage) {
    return { error: "Geen toegang om mensen te verwijderen." };
  }

  const { error: inviteError } = await client.from("invites").delete().eq("email", target);
  if (inviteError) {
    return { error: "Uitnodiging verwijderen is mislukt." };
  }

  const { data: profile } = await client
    .from("profiles")
    .select("id, user_kind")
    .eq("email", target)
    .maybeSingle();

  const targetIsAdmin = profile?.user_kind === "admin" || isAdminEmail(target);
  const actorIsAdmin = isAdminEmail(actorEmail) || viewer?.user_kind === "admin";
  if (targetIsAdmin && !actorIsAdmin) {
    return { error: "Admin kan niet verwijderd worden." };
  }

  if (profile?.id && isUuid(String(profile.id)) && admin) {
    const { error } = await admin.auth.admin.deleteUser(String(profile.id));
    if (error) {
      return { error: "Account verwijderen in Supabase is mislukt." };
    }
  }

  const { error: profileError } = await client.from("profiles").delete().eq("email", target);
  if (profileError) {
    const { data: stillThere } = await client.from("profiles").select("id").eq("email", target).maybeSingle();
    if (stillThere) {
      return { error: "Verwijderen in de database is mislukt." };
    }
  }

  return {};
}
