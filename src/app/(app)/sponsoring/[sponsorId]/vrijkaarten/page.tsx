import { BenefitTable } from "@/components/sponsor-tables";

type PageProps = { params: Promise<{ sponsorId: string }> };

export default async function SponsorVrijkaartenPage({ params }: PageProps) {
  const { sponsorId } = await params;
  return <BenefitTable sponsorId={sponsorId} type="vrijkaarten" />;
}
