import { BenefitTable } from "@/components/sponsor-tables";

type PageProps = { params: Promise<{ sponsorId: string }> };

export default async function SponsorDrankbonnenPage({ params }: PageProps) {
  const { sponsorId } = await params;
  return <BenefitTable sponsorId={sponsorId} type="drankbonnen" />;
}
