import { InvoiceTable } from "@/components/sponsor-tables";

type PageProps = { params: Promise<{ sponsorId: string }> };

export default async function SponsorFacturenPage({ params }: PageProps) {
  const { sponsorId } = await params;
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        Gegenereerde facturen voor deze sponsor. Maak een nieuwe via het overzicht.
      </p>
      <InvoiceTable sponsorId={sponsorId} />
    </div>
  );
}
