"use client";

import { loadDirectoryPeople, deleteDirectoryPerson, type DirectoryPerson } from "@/app/(app)/medewerkers/actions";
import { isAdminEmail } from "@/lib/admins";
import { defaultUsers } from "@/lib/users";
import { createNewUser, defaultTshirtSize, isUsablePersonName, joinName, sanitizeDays, sanitizeModules, sanitizeTasks, splitName, type AppUser } from "@/lib/permissions";
import {
  clearFestivalPost,
  daysFromFestivalByDay,
  festivalSchedulePatch,
  mergeFestivalTasks,
  sanitizeAfbouwDays,
  sanitizeFestivalByDay,
  sanitizeOpbouwDays,
} from "@/lib/staff-tasks";
import { needsTshirt, sanitizeTshirtSize, type TshirtSize } from "@/lib/tshirts";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const USERS_KEY = "backstage.users";
const VIEW_AS_KEY = "backstage.viewAsUserId";
const TSHIRT_NOTICES_KEY = "backstage.tshirtNotices";
const REMOVED_EMAILS_KEY = "backstage.removedEmails";

export type TshirtNotice = {
  id: string;
  userId: string;
  fullName: string;
  size: string;
  time: string;
};

type UsersContextValue = {
  users: AppUser[];
  usersReady: boolean;
  currentUser: AppUser;
  sessionUser: AppUser;
  realAdminId: string;
  viewingAsOther: boolean;
  tshirtNotices: TshirtNotice[];
  setCurrentUserId: (id: string) => void;
  stopViewingAs: () => void;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  addUser: (user: AppUser) => void;
  refreshDirectory: () => Promise<void>;
  removeUser: (id: string) => Promise<{ error?: string }>;
  removeTaskFromAll: (taskId: string) => void;
  confirmTshirt: (id: string, size: TshirtSize, saturdaySize?: TshirtSize | null) => void;
};

const UsersContext = createContext<UsersContextValue | null>(null);

function normalizeUser(user: Partial<AppUser> & { fullName?: string; email?: string }): AppUser {
  const names = splitName(user.fullName ?? "");
  const firstName = user.firstName || names.firstName;
  const lastName = user.lastName ?? names.lastName;
  const email = (user.email ?? "").toLowerCase();
  const kind = isAdminEmail(email) ? "admin" : (user.kind ?? "staff");
  const tasks = sanitizeTasks(user.tasks);
  const festivalByDay = sanitizeFestivalByDay(user.festivalByDay, sanitizeDays(user.days), tasks);
  const days = daysFromFestivalByDay(festivalByDay);

  return {
    id: user.id ?? `user-${crypto.randomUUID()}`,
    firstName,
    lastName,
    fullName: user.fullName || joinName(firstName, lastName),
    email,
    phone: user.phone,
    initials: user.initials || `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase(),
    kind,
    modules: sanitizeModules(user.modules),
    tasks: mergeFestivalTasks(tasks, festivalByDay),
    days,
    festivalByDay,
    opbouwDays: sanitizeOpbouwDays(user.opbouwDays),
    afbouwDays: sanitizeAfbouwDays(user.afbouwDays),
    tshirtSizeLastYear: sanitizeTshirtSize(user.tshirtSizeLastYear),
    tshirtSize: defaultTshirtSize(user.tshirtSizeLastYear, user.tshirtSize),
    tshirtSizeSaturday:
      sanitizeTshirtSize(user.tshirtSizeSaturday) ??
      (days === "both" && user.tshirtConfirmed
        ? defaultTshirtSize(user.tshirtSizeLastYear, user.tshirtSize)
        : null),
    tshirtConfirmed: Boolean(user.tshirtConfirmed),
    active: user.active ?? true,
    invitePending: Boolean(user.invitePending),
  };
}

function readRemovedEmails(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  try {
    const raw = window.localStorage.getItem(REMOVED_EMAILS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.map((email) => String(email).toLowerCase()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function writeRemovedEmails(emails: Set<string>) {
  window.localStorage.setItem(REMOVED_EMAILS_KEY, JSON.stringify([...emails]));
}

function rememberRemovedEmail(email: string) {
  const emails = readRemovedEmails();
  emails.add(email.toLowerCase());
  writeRemovedEmails(emails);
}

function forgetRemovedEmail(email: string) {
  const emails = readRemovedEmails();
  emails.delete(email.toLowerCase());
  writeRemovedEmails(emails);
}

function isSeedAdmin(user: { id: string; email: string }) {
  return user.id === "yves" || isAdminEmail(user.email);
}

function mergeMissingDefaults(stored: AppUser[]): AppUser[] {
  const removed = readRemovedEmails();
  const emails = new Set(stored.map((user) => user.email.toLowerCase()));
  const ids = new Set(stored.map((user) => user.id));
  const hasAdmin = stored.some((user) => user.kind === "admin" || isAdminEmail(user.email));
  const extra = defaultUsers
    .filter((user) => {
      if (ids.has(user.id) || emails.has(user.email.toLowerCase())) {
        return false;
      }

      if (removed.has(user.email.toLowerCase())) {
        return false;
      }

      if (hasAdmin && isSeedAdmin(user)) {
        return false;
      }

      return true;
    })
    .map(normalizeUser);

  return extra.length === 0 ? stored : [...stored, ...extra];
}

function readUsers(): AppUser[] {
  if (typeof window === "undefined") {
    return defaultUsers;
  }

  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return mergeMissingDefaults([]);
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<AppUser>>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return mergeMissingDefaults([]);
    }

    return mergeMissingDefaults(parsed.map(normalizeUser));
  } catch {
    return defaultUsers.map(normalizeUser);
  }
}

function pickName(fromDb: string, fromLocal: string | undefined, email: string) {
  if (isUsablePersonName(fromDb, email)) {
    return fromDb;
  }

  if (fromLocal && isUsablePersonName(fromLocal, email)) {
    return fromLocal;
  }

  return fromDb;
}

function isDefaultUser(user: AppUser) {
  const email = user.email.toLowerCase();
  return defaultUsers.some((entry) => entry.id === user.id || entry.email.toLowerCase() === email);
}

function mergeDirectory(users: AppUser[], people: DirectoryPerson[]): AppUser[] {
  const removed = readRemovedEmails();
  if (people.length === 0) {
    return users.filter((user) => !removed.has(user.email.toLowerCase()));
  }

  const localByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]));
  const seen = new Set<string>();
  const merged: AppUser[] = [];

  for (const person of people) {
    const email = person.email.toLowerCase();
    seen.add(email);
    const existing = localByEmail.get(email);
    const firstName = pickName(person.firstName, existing?.firstName, email);
    const lastName = pickName(person.lastName, existing?.lastName, email);

    merged.push(
      normalizeUser({
        ...(existing ?? {}),
        id: person.id,
        firstName,
        lastName,
        fullName: joinName(firstName, lastName) || pickName(person.fullName, existing?.fullName, email),
        email,
        kind: person.kind,
        modules: person.modules.length > 0 ? person.modules : existing?.modules,
        invitePending: person.invitePending,
        active: existing?.active ?? true,
      }),
    );
  }

  const hasAdmin = merged.some((user) => user.kind === "admin" || isAdminEmail(user.email));
  for (const user of users) {
    const email = user.email.toLowerCase();
    if (seen.has(email) || removed.has(email) || !isDefaultUser(user)) {
      continue;
    }

    if (hasAdmin && isSeedAdmin(user)) {
      continue;
    }

    merged.push(user);
  }

  return merged;
}

function applyLoggedInEmail(
  users: AppUser[],
  email: string,
  metadata?: { first_name?: string; last_name?: string; full_name?: string },
) {
  const admin = isAdminEmail(email);
  const metaFirst = isUsablePersonName(metadata?.first_name ?? "", email) ? metadata?.first_name ?? "" : "";
  const metaLast = isUsablePersonName(metadata?.last_name ?? "", email) ? metadata?.last_name ?? "" : "";
  const names = splitName(isUsablePersonName(metadata?.full_name ?? "", email) ? metadata?.full_name ?? "" : "");
  const firstName = metaFirst || names.firstName || (admin ? "Yves" : "");
  const lastName = metaLast || names.lastName || (admin ? "Moreel" : "");

  const byEmail = users.find((user) => user.email.toLowerCase() === email);
  if (byEmail) {
    const sessionId = byEmail.id;
    const next = users
      .map((user) =>
        user.id === sessionId
          ? normalizeUser({
              ...user,
              email,
              kind: admin ? "admin" : user.kind,
              firstName: isUsablePersonName(user.firstName, email) ? user.firstName : firstName,
              lastName: isUsablePersonName(user.lastName, email) ? user.lastName : lastName,
            })
          : user,
      )
      .filter((user) => user.email.toLowerCase() !== email || user.id === sessionId);

    return { users: next, sessionId };
  }

  if (admin) {
    const yves = users.find((user) => user.id === "yves") ?? users[0];
    const sessionId = yves?.id ?? "yves";
    const next = users
      .map((user) =>
        user.id === sessionId
          ? normalizeUser({
              ...user,
              id: sessionId,
              email,
              firstName,
              lastName,
              kind: "admin",
            })
          : user,
      )
      .filter((user) => user.email.toLowerCase() !== email || user.id === sessionId);

    return { users: next, sessionId };
  }

  const created = createNewUser({ firstName, lastName, email });
  return { users: [...users, created], sessionId: created.id };
}

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<AppUser[]>(defaultUsers);
  const [sessionUserId, setSessionUserId] = useState("yves");
  const [viewAsUserId, setViewAsUserId] = useState<string | null>(null);
  const [tshirtNotices, setTshirtNotices] = useState<TshirtNotice[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedUsers = readUsers();
    setUsers(storedUsers);

    try {
      const rawNotices = window.localStorage.getItem(TSHIRT_NOTICES_KEY);
      if (rawNotices) {
        setTshirtNotices(JSON.parse(rawNotices) as TshirtNotice[]);
      }
    } catch {
      setTshirtNotices([]);
    }

    try {
      const supabase = createBrowserClient();
      void supabase.auth
        .getUser()
        .then(async ({ data }) => {
          const email = data.user?.email?.toLowerCase();
          let nextUsers = storedUsers;

          if (email) {
            const applied = applyLoggedInEmail(storedUsers, email, data.user?.user_metadata);
            nextUsers = applied.users;
            setSessionUserId(applied.sessionId);

            const storedViewAs = window.localStorage.getItem(VIEW_AS_KEY);
            if (
              storedViewAs &&
              storedViewAs !== applied.sessionId &&
              applied.users.some((user) => user.id === storedViewAs)
            ) {
              setViewAsUserId(storedViewAs);
            } else {
              setViewAsUserId(null);
              window.localStorage.removeItem(VIEW_AS_KEY);
            }
          }

          try {
            nextUsers = mergeDirectory(nextUsers, await loadDirectoryPeople());
            if (email) {
              const session = nextUsers.find((user) => user.email.toLowerCase() === email);
              if (session) {
                setSessionUserId(session.id);
              }
            }
          } catch {
            // Keep local users if the database is not ready yet.
          }

          setUsers(nextUsers);
          setReady(true);
        })
        .catch(() => {
          setReady(true);
        });
    } catch {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    window.localStorage.setItem(TSHIRT_NOTICES_KEY, JSON.stringify(tshirtNotices));
    if (viewAsUserId) {
      window.localStorage.setItem(VIEW_AS_KEY, viewAsUserId);
    } else {
      window.localStorage.removeItem(VIEW_AS_KEY);
    }
  }, [users, viewAsUserId, tshirtNotices, ready]);

  const refreshDirectory = useCallback(async () => {
    try {
      const people = await loadDirectoryPeople();
      setUsers((current) => mergeDirectory(current, people));
    } catch {
      // Keep the current list if the database is unreachable.
    }
  }, []);

  const value = useMemo<UsersContextValue>(() => {
    const sessionUser = users.find((user) => user.id === sessionUserId) ?? users[0];
    const currentUser =
      (viewAsUserId ? users.find((user) => user.id === viewAsUserId) : sessionUser) ?? sessionUser;

    return {
      users,
      usersReady: ready,
      currentUser,
      sessionUser,
      realAdminId: sessionUser.id,
      viewingAsOther: Boolean(viewAsUserId && viewAsUserId !== sessionUser.id),
      tshirtNotices,
      setCurrentUserId(id) {
        if (id === sessionUserId) {
          setViewAsUserId(null);
          return;
        }
        setViewAsUserId(id);
      },
      stopViewingAs() {
        setViewAsUserId(null);
      },
      updateUser(id, patch) {
        setUsers((current) => {
          const actor = current.find((user) => user.id === sessionUserId);

          return current.map((user) => {
            if (user.id !== id) {
              return user;
            }

            if (!actor) {
              return user;
            }

            if (actor.kind === "staff") {
              if (user.id !== actor.id) {
                return user;
              }

              return {
                ...user,
                tshirtSize:
                  patch.tshirtSize !== undefined
                    ? sanitizeTshirtSize(patch.tshirtSize)
                    : user.tshirtSize,
                tshirtSizeSaturday:
                  patch.tshirtSizeSaturday !== undefined
                    ? sanitizeTshirtSize(patch.tshirtSizeSaturday)
                    : user.tshirtSizeSaturday,
                tshirtConfirmed: patch.tshirtConfirmed ?? user.tshirtConfirmed,
              };
            }

            const next = { ...user, ...patch };
            if (patch.firstName !== undefined || patch.lastName !== undefined) {
              next.fullName = joinName(next.firstName, next.lastName);
            }

            if (actor.kind !== "admin") {
              const { kind: _kind, modules: _modules, ...safePatch } = patch;
              const safeNext = { ...user, ...safePatch };
              if (patch.firstName !== undefined || patch.lastName !== undefined) {
                safeNext.fullName = joinName(safeNext.firstName, safeNext.lastName);
              }
              return safeNext;
            }

            if (user.kind === "admin" && user.id === sessionUserId) {
              const { kind: _kind, modules: _modules, ...safePatch } = patch;
              const safeNext = { ...user, ...safePatch };
              if (patch.firstName !== undefined || patch.lastName !== undefined) {
                safeNext.fullName = joinName(safeNext.firstName, safeNext.lastName);
              }
              return safeNext;
            }

            if (patch.kind === "staff") {
              return { ...next, kind: "staff", modules: [] };
            }

            return next;
          });
        });
      },
      addUser(user) {
        forgetRemovedEmail(user.email);
        setUsers((current) => {
          if (current.some((entry) => entry.email.toLowerCase() === user.email.toLowerCase())) {
            return current;
          }

          const tasks = sanitizeTasks(user.tasks);
          const festivalByDay = sanitizeFestivalByDay(user.festivalByDay, sanitizeDays(user.days), tasks);

          return [
            ...current,
            {
              ...user,
              kind: isAdminEmail(user.email) ? "admin" : user.kind === "team" ? "team" : "staff",
              modules: user.kind === "team" ? sanitizeModules(user.modules) : [],
              ...festivalSchedulePatch(tasks, festivalByDay, sanitizeOpbouwDays(user.opbouwDays)),
              afbouwDays: sanitizeAfbouwDays(user.afbouwDays),
              tshirtSizeLastYear: sanitizeTshirtSize(user.tshirtSizeLastYear),
              tshirtSize: defaultTshirtSize(user.tshirtSizeLastYear, user.tshirtSize),
              tshirtSizeSaturday: sanitizeTshirtSize(user.tshirtSizeSaturday),
              tshirtConfirmed: false,
              invitePending: user.invitePending ?? true,
            },
          ];
        });
      },
      refreshDirectory,
      removeTaskFromAll(taskId) {
        setUsers((current) =>
          current.map((user) => {
            const byDay = user.festivalByDay ?? {};
            const tasks = user.tasks.filter((task) => task !== taskId);
            if (
              tasks.length === user.tasks.length &&
              byDay.friday !== taskId &&
              byDay.saturday !== taskId
            ) {
              return user;
            }

            return { ...user, ...festivalSchedulePatch(tasks, clearFestivalPost(byDay, taskId), user.opbouwDays) };
          }),
        );
      },
      async removeUser(id) {
        const actor = users.find((user) => user.id === sessionUserId);
        const target = users.find((user) => user.id === id);
        const canManage =
          actor?.kind === "admin" || Boolean(actor?.modules.includes("medewerkers"));

        if (
          !actor ||
          !target ||
          !canManage ||
          target.id === sessionUserId ||
          target.email.toLowerCase() === actor.email.toLowerCase() ||
          (target.kind === "admin" && actor.kind !== "admin")
        ) {
          return { error: "Deze persoon kan niet verwijderd worden." };
        }

        const result = await deleteDirectoryPerson(target.email);
        if (result.error) {
          return result;
        }

        rememberRemovedEmail(target.email);
        setUsers((current) =>
          current.filter(
            (user) => user.id !== id && user.email.toLowerCase() !== target.email.toLowerCase(),
          ),
        );
        if (viewAsUserId === id) {
          setViewAsUserId(null);
        }
        return {};
      },
      confirmTshirt(id, size, saturdaySize) {
        const target = users.find((user) => user.id === id);
        const actor = users.find((user) => user.id === sessionUserId);
        if (!target || !actor) {
          return;
        }

        if (actor.kind === "staff" && actor.id !== id) {
          return;
        }

        if (
          actor.id !== id &&
          actor.kind !== "admin" &&
          !actor.modules.includes("medewerkers")
        ) {
          return;
        }

        const twoDays = target.days === "both";
        const nextSaturday = twoDays ? sanitizeTshirtSize(saturdaySize ?? size) : null;
        if (twoDays && !nextSaturday) {
          return;
        }

        setUsers((current) =>
          current.map((user) =>
            user.id === id
              ? {
                  ...user,
                  tshirtSize: size,
                  tshirtSizeSaturday: nextSaturday,
                  tshirtConfirmed: true,
                }
              : user,
          ),
        );

        if (needsTshirt(target.kind)) {
          const sizeLabel =
            twoDays && nextSaturday && nextSaturday !== size
              ? `Vr ${size} · Za ${nextSaturday}`
              : twoDays
                ? `2× ${size}`
                : size;
          setTshirtNotices((current) => [
            {
              id: `tshirt-${id}-${Date.now()}`,
              userId: id,
              fullName: target.fullName,
              size: sizeLabel,
              time: "Zojuist",
            },
            ...current,
          ].slice(0, 20));
        }
      },
    };
  }, [users, sessionUserId, viewAsUserId, tshirtNotices, refreshDirectory, ready]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("useUsers must be used within UsersProvider");
  }

  return context;
}
