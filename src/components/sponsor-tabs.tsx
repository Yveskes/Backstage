"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pillClass } from "@/lib/pills";

const tabs = [
  { href: "", label: "Overzicht" },
  { href: "/facturen", label: "Facturen" },
  { href: "/drankbonnen", label: "Drankbonnen" },
  { href: "/vrijkaarten", label: "Vrijkaarten" },
] as const;

export function SponsorTabs({ sponsorId }: { sponsorId: string }) {
  const pathname = usePathname();
  const base = `/sponsoring/${sponsorId}`;

  if (/\/facturen\/[^/]+$/.test(pathname)) {
    return null;
  }

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const href = `${base}${tab.href}`;
        const active = tab.href === "" ? pathname === base : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={tab.label}
            href={href}
            className={pillClass(active)}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
