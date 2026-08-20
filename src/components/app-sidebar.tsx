"use client";

import { LogoutButton } from "@/components/logout-button";
import { HeaderActions } from "@/components/header-actions";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { type NavItem } from "@/lib/navigation";
import { navigationForUser } from "@/lib/navigation-access";
import { homePath } from "@/lib/permissions";
import { useUsers } from "@/components/users-provider";

function isParentActive(pathname: string, item: NavItem) {
  if (item.href === "/") {
    return pathname === "/";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { currentUser, users, sessionUser, viewingAsOther, setCurrentUserId } = useUsers();
  const items = navigationForUser(currentUser);
  const home = homePath(currentUser);

  return (
    <>
      <header className="relative z-30 flex min-w-0 items-center justify-between gap-2 border-b border-zinc-800 bg-zinc-950 px-4 py-3 lg:hidden">
        <Link href={home} className="shrink-0 text-sm font-semibold tracking-wide text-white">
          Backstage
        </Link>
        <div className="flex min-w-0 items-center gap-1.5">
          <HeaderActions variant="dark" />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="shrink-0 rounded-md border border-zinc-700 px-2.5 py-1.5 text-sm text-zinc-200"
            aria-expanded={open}
            aria-controls="app-sidebar"
          >
            Menu
          </button>
        </div>
      </header>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Menu sluiten"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="hidden w-64 shrink-0 lg:block" aria-hidden="true" />

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-zinc-800 px-5 py-5">
          <Link href={home} onClick={() => setOpen(false)} className="block">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Zeverrock
            </p>
            <p className="mt-1 text-lg font-semibold text-white">Backstage</p>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {items.map((item) => {
              const parentActive = isParentActive(pathname, item);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      parentActive
                        ? "bg-white text-zinc-950"
                        : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>

                  {item.children ? (
                    <ul className="mt-1 mb-3 ml-3 space-y-1 border-l border-zinc-800 pl-3">
                      {item.children.map((child) => {
                        const active =
                          pathname === child.href || pathname.startsWith(`${child.href}/`);

                        return (
                          <li key={child.label}>
                            <Link
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={`block rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                                active
                                  ? "text-white"
                                  : "text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto border-t border-zinc-800 p-3">
          <Link
            href="/profiel"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${
              pathname === "/profiel"
                ? "bg-white text-zinc-950"
                : "text-zinc-200 hover:bg-zinc-900 hover:text-white"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                pathname === "/profiel" ? "bg-zinc-900 text-white" : "bg-zinc-800 text-zinc-100"
              }`}
            >
              {currentUser.initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{currentUser.fullName}</span>
              <span
                className={`block truncate text-xs ${
                  pathname === "/profiel" ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                Profiel wijzigen
              </span>
            </span>
          </Link>
          <LogoutButton />
          {sessionUser.kind === "admin" && !viewingAsOther ? (
            <label className="mt-2 block px-2">
              <span className="sr-only">Bekijk als andere gebruiker</span>
              <select
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300"
                defaultValue=""
                onChange={(event) => {
                  const id = event.target.value;
                  if (!id) {
                    return;
                  }
                  const target = users.find((user) => user.id === id);
                  setCurrentUserId(id);
                  router.push(homePath(target ?? currentUser));
                  event.target.value = "";
                }}
              >
                <option value="">Bekijk als…</option>
                {users
                  .filter((user) => user.id !== sessionUser.id)
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} ({user.kind === "staff" ? "medewerker" : "team"})
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
        </div>
      </aside>
    </>
  );
}
