"use client";

import { useSponsors } from "@/components/sponsors-provider";
import Link from "next/link";

export function SponsorHeader({ sponsorId }: { sponsorId: string }) {
  const { getSponsor } = useSponsors();
  const sponsor = getSponsor(sponsorId);

  if (!sponsor) {
    return null;
  }

  const contact = sponsor.billing.invoiceContactName || sponsor.contactName;
  const email = sponsor.billing.invoiceEmail || sponsor.contactEmail;

  return (
    <div className="mb-6">
      <p className="text-sm text-zinc-500">
        <Link href={`/sponsoring?jaar=${sponsor.year}`} className="hover:text-zinc-800">
          Sponsoring
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">{sponsor.name}</span>
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">{sponsor.name}</h1>
      <p className="mt-1 text-sm text-zinc-500">
        {sponsor.packageLabel} · {contact} · {email}
      </p>
    </div>
  );
}
