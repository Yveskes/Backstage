"use client";

import Link from "next/link";
import { useSponsors } from "@/components/sponsors-provider";
import { formatSponsorEuro, sponsorStatusLabel } from "@/lib/sponsors";

export function SponsorList({ year }: { year: number }) {
  const { sponsors } = useSponsors();
  const rows = sponsors
    .filter((sponsor) => sponsor.year === year)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Nog geen sponsors voor {year}.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Sponsor</th>
            <th className="px-4 py-3 font-medium">Pakket</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((sponsor) => (
            <tr key={sponsor.id} className="relative border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
              <td className="px-4 py-3">
                <Link
                  href={`/sponsoring/${sponsor.id}`}
                  className="font-medium text-zinc-900 after:absolute after:inset-0 hover:underline"
                >
                  {sponsor.name}
                </Link>
                <p className="text-xs text-zinc-500">{formatSponsorEuro(sponsor.amount)}</p>
              </td>
              <td className="px-4 py-3 text-zinc-600">{sponsor.packageLabel}</td>
              <td className="px-4 py-3 text-zinc-600">{sponsor.contactName}</td>
              <td className="px-4 py-3 text-zinc-600">{sponsorStatusLabel[sponsor.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
