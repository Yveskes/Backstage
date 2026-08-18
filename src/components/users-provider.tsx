"use client";

import { isAdminEmail } from "@/lib/admins";
import { defaultUsers } from "@/lib/users";
import { createNewUser, defaultTshirtSize, joinName, sanitizeDays, sanitizeModules, sanitizeTasks, splitName, type AppUser } from "@/lib/permissions";
import { sanitizeAfbouwDays, sanitizeOpbouwDays } from "@/lib/staff-tasks";
import { needsTshirt, sanitizeTshirtSize, type TshirtSize } from "@/lib/tshirts";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const USERS_KEY = "backstage.users";
const VIEW_AS_KEY = "backstage.viewAsUserId";
const TSHIRT_NOTICES_KEY = "backstage.tshirtNotices";

export type TshirtNotice = {
  id: string;
  userId: string;
  fullName: string;
  size: TshirtSize;
  time: string;
};

type UsersContextValue = {
  users: AppUser[];
  currentUser: AppUser;
  sessionUser: AppUser;
  realAdminId: string;
  viewingAsOther: boolean;
  tshirtNotices: TshirtNotice[];
  setCurrentUserId: (id: string) => void;
  stopViewingAs: () => void;
  updateUser: (id: string, patch: Partial<AppUser>) => void;
  addUser: (user: AppUser) => void;
  removeUser: (id: string) => boolean;
  confirmTshirt: (id: string, size: TshirtSize) => void;
};

const UsersContext = createContext<UsersContextValue | null>(null);

function normalizeUser(user: Partial<AppUser> & { fullName?: string; email?: string }): AppUser {
  const names = splitName(user.fullName ?? "");
  const firstName = user.firstName || names.firstName;
  const lastName = user.lastName ?? names.lastName;
  const email = (user.email ?? "").toLowerCase();
  const kind = isAdminEmail(email) ? "admin" : (user.kind ?? "staff");

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
    tasks: sanitizeTasks(user.tasks),
    days: sanitizeDays(user.days),
    opbouwDays: sanitizeOpbouwDays(user.opbouwDays),
    afbouwDays: sanitizeAfbouwDays(user.afbouwDays),
    tshirtSizeLastYear: sanitizeTshirtSize(user.tshirtSizeLastYear),
    tshirtSize: defaultTshirtSize(user.tshirtSizeLastYear, user.tshirtSize),
    tshirtConfirmed: Boolean(user.tshirtConfirmed),
    active: user.active ?? true,
  };
}

function mergeMissingDefaults(stored: AppUser[]): AppUser[] {
  const emails = new Set(stored.map((user) => user.email.toLowerCase()));
  const ids = new Set(stored.map((user) => user.id));
  const extra = defaultUsers
    .filter((user) => !ids.has(user.id) && !emails.has(user.email.toLowerCase()))
    .map(normalizeUser);

  return extra.length === 0 ? stored : [...stored, ...extra];
}

function readUsers(): AppUser[] {
  if (typeof window === "undefined") {
    return defaultUsers;
  }

  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return defaultUsers.map(normalizeUser);
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<AppUser>>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultUsers.map(normalizeUser);
    }

    return mergeMissingDefaults(parsed.map(normalizeUser));
  } catch {
    return defaultUsers.map(normalizeUser);
  }
}

function applyLoggedInEmail(
  users: AppUser[],
  email: string,
  metadata?: { first_name?: string; last_name?: string; full_name?: string },
) {
  const admin = isAdminEmail(email);
  const names = splitName(metadata?.full_name || "");
  const firstName = metadata?.first_name || names.firstName || (admin ? "Yves" : email.split("@")[0]);
  const lastName = metadata?.last_name || names.lastName || (admin ? "Moreel" : "");

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
              firstName: user.firstName.includes("@") ? firstName : user.firstName,
              lastName: user.lastName || lastName,
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
        .then(({ data }) => {
          const email = data.user?.email?.toLowerCase();
          if (!email) {
            setReady(true);
            return;
          }

          const applied = applyLoggedInEmail(storedUsers, email, data.user?.user_metadata);
          setUsers(applied.users);
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

  const value = useMemo<UsersContextValue>(() => {
    const sessionUser = users.find((user) => user.id === sessionUserId) ?? users[0];
    const currentUser =
      (viewAsUserId ? users.find((user) => user.id === viewAsUserId) : sessionUser) ?? sessionUser;

    return {
      users,
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
        setUsers((current) => [
          ...current,
          {
            ...user,
            kind: isAdminEmail(user.email) ? "admin" : user.kind === "team" ? "team" : "staff",
            modules: user.kind === "team" ? sanitizeModules(user.modules) : [],
            tasks: sanitizeTasks(user.tasks),
            days: sanitizeDays(user.days),
            opbouwDays: sanitizeOpbouwDays(user.opbouwDays),
            afbouwDays: sanitizeAfbouwDays(user.afbouwDays),
            tshirtSizeLastYear: sanitizeTshirtSize(user.tshirtSizeLastYear),
            tshirtSize: defaultTshirtSize(user.tshirtSizeLastYear, user.tshirtSize),
            tshirtConfirmed: false,
          },
        ]);
      },
      removeUser(id) {
        const actor = users.find((user) => user.id === sessionUserId);
        const target = users.find((user) => user.id === id);
        const canManage =
          actor?.kind === "admin" || Boolean(actor?.modules.includes("medewerkers"));

        if (!actor || !target || !canManage || target.id === sessionUserId || target.kind === "admin") {
          return false;
        }

        setUsers((current) => current.filter((user) => user.id !== id));
        if (viewAsUserId === id) {
          setViewAsUserId(null);
        }
        return true;
      },
      confirmTshirt(id, size) {
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

        setUsers((current) =>
          current.map((user) =>
            user.id === id ? { ...user, tshirtSize: size, tshirtConfirmed: true } : user,
          ),
        );

        if (needsTshirt(target.kind)) {
          setTshirtNotices((current) => [
            {
              id: `tshirt-${id}-${Date.now()}`,
              userId: id,
              fullName: target.fullName,
              size,
              time: "Zojuist",
            },
            ...current,
          ].slice(0, 20));
        }
      },
    };
  }, [users, sessionUserId, viewAsUserId, tshirtNotices]);

  if (!ready) {
    return <div className="min-h-dvh bg-zinc-100" />;
  }

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error("useUsers must be used within UsersProvider");
  }

  return context;
}
