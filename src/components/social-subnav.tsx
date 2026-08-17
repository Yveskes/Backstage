"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/social-media/kalender", label: "Kalender" },
  { href: "/social-media/posts", label: "Posts" },
  { href: "/social-media/ideeen", label: "Ideeën" },
] as const;

export function SocialSubnav() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
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
