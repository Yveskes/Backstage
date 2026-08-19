import type { AfbouwDayId, OpbouwDayId, StaffDayId, StaffTaskId } from "@/lib/staff-tasks";
import { isStaffDayId, isStaffTaskId } from "@/lib/staff-tasks";
import type { TshirtSize } from "@/lib/tshirts";
import { sanitizeTshirtSize } from "@/lib/tshirts";

export type UserKind = "admin" | "team" | "staff";

export type ModuleId =
  | "medewerkers"
  | "social-media"
  | "documenten"
  | "media"
  | "sponsoring";

export type ModuleOption = {
  id: ModuleId;
  label: string;
  description: string;
};

export const moduleIds: ModuleId[] = [
  "medewerkers",
  "social-media",
  "documenten",
  "media",
  "sponsoring",
];

export const moduleOptions: ModuleOption[] = [
  {
    id: "medewerkers",
    label: "Medewerkers",
    description: "Mensen toevoegen, taken toewijzen en verwijderen.",
  },
  {
    id: "social-media",
    label: "Social Media",
    description: "Kalender, posts en ideeën.",
  },
  {
    id: "documenten",
    label: "Documenten",
    description: "Bestanden uit Google Drive bekijken en downloaden.",
  },
  {
    id: "media",
    label: "Media",
    description: "Foto's, video's en brandbook.",
  },
  {
    id: "sponsoring",
    label: "Sponsoring",
    description: "Sponsors, facturen, drankbonnen en vrijkaarten.",
  },
];

export type AppUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  initials: string;
  kind: UserKind;
  modules: ModuleId[];
  tasks: StaffTaskId[];
  days: StaffDayId | null;
  opbouwDays: OpbouwDayId[];
  afbouwDays: AfbouwDayId[];
  tshirtSizeLastYear: TshirtSize | null;
  tshirtSize: TshirtSize | null;
  tshirtConfirmed: boolean;
  active: boolean;
  invitePending?: boolean;
};

export const kindLabel: Record<UserKind, string> = {
  admin: "Admin",
  team: "Team Zeverrock",
  staff: "Medewerker",
};

export function sanitizeModules(modules: unknown): ModuleId[] {
  const ids = Array.isArray(modules) ? modules : [];
  const next: ModuleId[] = [];

  for (const raw of ids) {
    const mapped = String(raw).startsWith("sponsoring") ? "sponsoring" : raw;
    if (moduleIds.includes(mapped as ModuleId) && !next.includes(mapped as ModuleId)) {
      next.push(mapped as ModuleId);
    }
  }

  return next;
}

export function sanitizeTasks(tasks: unknown): StaffTaskId[] {
  const ids = Array.isArray(tasks) ? tasks : [];
  return ids.filter(isStaffTaskId).filter((id, index, all) => all.indexOf(id) === index);
}

export function sanitizeDays(days: unknown): StaffDayId | null {
  return isStaffDayId(days) ? days : null;
}

export function defaultTshirtSize(lastYear: unknown, current: unknown): TshirtSize | null {
  return sanitizeTshirtSize(current) ?? sanitizeTshirtSize(lastYear);
}

export function hasModule(user: AppUser, moduleId: ModuleId) {
  if (user.kind === "admin") {
    return true;
  }

  if (user.kind === "staff") {
    return false;
  }

  return user.modules.includes(moduleId);
}

export function pathToModule(pathname: string): ModuleId | "public" | "staff-portal" | "admin" {
  if (
    pathname === "/" ||
    pathname === "/profiel" ||
    pathname === "/meldingen" ||
    pathname.startsWith("/meldingen/")
  ) {
    return "public";
  }

  if (pathname === "/mijn" || pathname.startsWith("/mijn/")) {
    return "staff-portal";
  }

  if (pathname.startsWith("/medewerkers")) {
    return "medewerkers";
  }

  if (pathname.startsWith("/social-media")) {
    return "social-media";
  }

  if (pathname.startsWith("/documenten")) {
    return "documenten";
  }

  if (pathname.startsWith("/media")) {
    return "media";
  }

  if (pathname.startsWith("/sponsoring")) {
    return "sponsoring";
  }

  return "public";
}

export function canAccessPath(user: AppUser, pathname: string) {
  const moduleId = pathToModule(pathname);

  if (moduleId === "public") {
    return (
      user.kind !== "staff" ||
      pathname === "/profiel" ||
      pathname === "/meldingen" ||
      pathname.startsWith("/meldingen/")
    );
  }

  if (moduleId === "staff-portal") {
    return user.kind === "staff" || user.kind === "admin";
  }

  if (user.kind === "staff") {
    return false;
  }

  if (moduleId === "admin") {
    return user.kind === "admin";
  }

  return hasModule(user, moduleId);
}

export function homePath(user: AppUser) {
  return user.kind === "staff" ? "/mijn" : "/";
}

export const DEFAULT_USER_KIND: UserKind = "staff";

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function joinName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function isUsablePersonName(value: string, email = "") {
  const name = value.trim();
  if (!name) {
    return false;
  }

  if (name.includes("@") || name.toLowerCase() === email.trim().toLowerCase()) {
    return false;
  }

  return true;
}

export function firstNameOf(user: Pick<AppUser, "firstName" | "fullName"> & { email?: string }) {
  const email = user.email ?? "";
  if (isUsablePersonName(user.firstName, email)) {
    return user.firstName.trim();
  }

  const fromFull = splitName(user.fullName).firstName;
  if (isUsablePersonName(fromFull, email)) {
    return fromFull;
  }

  return "daar";
}

export function initialsFromName(firstName: string, lastName = "") {
  const letters = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return letters || firstName.trim().slice(0, 2).toUpperCase() || "M";
}

export function createNewUser(input: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  kind?: UserKind;
}): AppUser {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const fullName = joinName(firstName, lastName);
  const kind = input.kind === "team" ? "team" : DEFAULT_USER_KIND;

  return {
    id: `user-${crypto.randomUUID()}`,
    firstName,
    lastName,
    fullName,
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    initials: initialsFromName(firstName, lastName),
    kind,
    modules: [],
    tasks: [],
    days: null,
    opbouwDays: [],
    afbouwDays: [],
    tshirtSizeLastYear: null,
    tshirtSize: null,
    tshirtConfirmed: false,
    active: true,
  };
}

export function canAssignRoles(user: AppUser) {
  return user.kind === "admin";
}

export function canManageStaff(user: AppUser) {
  return user.kind === "admin" || user.modules.includes("medewerkers");
}

export function canRemoveDirectoryPerson(actor: AppUser, target: AppUser) {
  if (!canManageStaff(actor) || actor.id === target.id) {
    return false;
  }

  if (actor.email.trim().toLowerCase() === target.email.trim().toLowerCase()) {
    return false;
  }

  if (target.kind === "admin") {
    return actor.kind === "admin";
  }

  return true;
}

export function canClaimExpenses(user: AppUser) {
  return user.kind === "admin" || user.kind === "team";
}
