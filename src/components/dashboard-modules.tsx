"use client";

import { useUsers } from "@/components/users-provider";
import { navigationForUser } from "@/lib/navigation-access";
import Link from "next/link";

export function DashboardModules() {
  const { currentUser } = useUsers();
  const items = navigationForUser(currentUser).filter((item) => item.module);

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
        >
          <h2 className="text-base font-semibold text-zinc-900">{item.label}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{item.description}</p>
        </Link>
      ))}
    </section>
  );
}
