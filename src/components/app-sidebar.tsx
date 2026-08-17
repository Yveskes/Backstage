"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navigation } from "@/lib/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3 lg:hidden">
        <Link href="/" className="text-sm font-semibold tracking-wide text-white">
          Backstage
        </Link>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200"
          aria-expanded={open}
          aria-controls="app-sidebar"
        >
          Menu
        </button>
      </header>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Menu sluiten"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-zinc-800 px-5 py-5">
          <Link href="/" onClick={() => setOpen(false)} className="block">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              Festival
            </p>
            <p className="mt-1 text-lg font-semibold text-white">Backstage</p>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((section) => (
            <div key={section.title} className="mb-6">
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                          active
                            ? "bg-white text-zinc-950"
                            : "text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-zinc-800 px-5 py-4">
          <p className="text-xs text-zinc-500">Actieve editie</p>
          <p className="mt-1 text-sm font-medium text-zinc-200">2026</p>
        </div>
      </aside>
    </>
  );
}
