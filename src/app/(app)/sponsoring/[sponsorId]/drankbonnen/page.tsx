import { SponsorBenefitsEditor } from "@/components/sponsor-benefits-editor";

type PageProps = { params: Promise<{ sponsorId: string }> };

export default async function SponsorDrankbonnenPage({ params }: PageProps) {
  const { sponsorId } = await params;
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <SponsorBenefitsEditor sponsorId={sponsorId} type="drankbonnen" />
    </section>
  );
}
