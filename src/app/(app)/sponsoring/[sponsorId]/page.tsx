import Link from "next/link";
import { getSponsor } from "@/lib/sponsors";

const statusLabel: Record<string, string> = {
  prospect: "Prospect",
  confirmed: "Bevestigd",
  paid: "Betaald",
};

type SponsorPageProps = PageProps<"/sponsoring/[sponsorId]">;

export default async function SponsorPage({ params }: SponsorPageProps) {
  const { sponsorId } = await params;
  const sponsor = getSponsor(sponsorId);

  if (!sponsor) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Pakket</p>
        <p className="mt-2 text-lg font-semibold text-zinc-900">{sponsor.packageTier}</p>
        <p className="mt-1 text-sm text-zinc-500">€ {sponsor.amount.toLocaleString("nl-BE")}</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status</p>
        <p className="mt-2 text-lg font-semibold text-zinc-900">{statusLabel[sponsor.status]}</p>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Gekoppelde items</p>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <Link href={`/sponsoring/${sponsor.id}/facturen`} className="text-zinc-700 hover:underline">
            Facturen
          </Link>
          <Link href={`/sponsoring/${sponsor.id}/drankbonnen`} className="text-zinc-700 hover:underline">
            Drankbonnen
          </Link>
          <Link href={`/sponsoring/${sponsor.id}/vrijkaarten`} className="text-zinc-700 hover:underline">
            Vrijkaarten
          </Link>
        </div>
      </div>
    </div>
  );
}
