"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "", label: "Overzicht" },
  { href: "/facturen", label: "Facturen" },
  { href: "/drankbonnen", label: "Drankbonnen" },
  { href: "/vrijkaarten", label: "Vrijkaarten" },
] as const;

export function SponsorTabs({ sponsorId }: { sponsorId: string }) {
  const pathname = usePathname();
  const base = `/sponsoring/${sponsorId}`;

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = tab.href === "" ? pathname === base : pathname === href;

        return (
          <Link
            key={tab.label}
            href={href}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-zinc-900 text-white"
                : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
