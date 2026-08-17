import Link from "next/link";
import { SponsorTabs } from "@/components/sponsor-tabs";
import { getSponsor } from "@/lib/sponsors";
import { notFound } from "next/navigation";

type SponsorLayoutProps = LayoutProps<"/sponsoring/[sponsorId]">;

export default async function SponsorLayout({ children, params }: SponsorLayoutProps) {
  const { sponsorId } = await params;
  const sponsor = getSponsor(sponsorId);

  if (!sponsor) {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-zinc-500">
          <Link href={`/sponsoring?jaar=${sponsor.year}`} className="hover:text-zinc-800">
            Sponsoring
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800">{sponsor.name}</span>
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          {sponsor.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {sponsor.packageTier} · {sponsor.contactName} · {sponsor.contactEmail}
        </p>
      </div>

      <SponsorTabs sponsorId={sponsor.id} />

      {children}
    </div>
  );
}
