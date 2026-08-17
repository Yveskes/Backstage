import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { YearSwitcher } from "@/components/year-switcher";
import { parseFestivalYear } from "@/lib/festival-year";
import { getSponsorsForYear } from "@/lib/sponsors";

const statusLabel: Record<string, string> = {
  prospect: "Prospect",
  confirmed: "Bevestigd",
  paid: "Betaald",
};

type SponsoringPageProps = {
  searchParams: Promise<{ jaar?: string | string[] }>;
};

export default async function SponsoringPage({ searchParams }: SponsoringPageProps) {
  const { jaar } = await searchParams;
  const year = parseFestivalYear(jaar);
  const sponsors = getSponsorsForYear(year);

  return (
    <>
      <PageHeader
        title="Sponsoring"
        description="Overzicht van de sponsors voor deze editie. Open een sponsor voor facturen, drankbonnen en vrijkaarten."
        actions={
          <YearSwitcher year={year} hrefForYear={(nextYear) => `/sponsoring?jaar=${nextYear}`} />
        }
      />

      {sponsors.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
          <p className="text-sm text-zinc-500">Nog geen sponsors voor {year}.</p>
        </div>
      ) : (
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
              {sponsors.map((sponsor) => (
                <tr key={sponsor.id} className="relative border-b border-zinc-100 last:border-0 hover:bg-zinc-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/sponsoring/${sponsor.id}`}
                      className="font-medium text-zinc-900 after:absolute after:inset-0 hover:underline"
                    >
                      {sponsor.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{sponsor.packageTier}</td>
                  <td className="px-4 py-3 text-zinc-600">{sponsor.contactName}</td>
                  <td className="px-4 py-3 text-zinc-600">{statusLabel[sponsor.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
