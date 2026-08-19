import { PageHeader } from "@/components/page-header";
import { SponsorList } from "@/components/sponsor-list";
import { YearSwitcher } from "@/components/year-switcher";
import { parseFestivalYear } from "@/lib/festival-year";

type SponsoringPageProps = {
  searchParams: Promise<{ jaar?: string | string[] }>;
};

export default async function SponsoringPage({ searchParams }: SponsoringPageProps) {
  const { jaar } = await searchParams;
  const year = parseFestivalYear(jaar);

  return (
    <>
      <PageHeader
        title="Sponsoring"
        description="Overzicht van de sponsors voor deze editie. Open een sponsor voor facturen, drankbonnen en vrijkaarten."
        actions={
          <YearSwitcher year={year} hrefForYear={(nextYear) => `/sponsoring?jaar=${nextYear}`} />
        }
      />
      <SponsorList year={year} />
    </>
  );
}
