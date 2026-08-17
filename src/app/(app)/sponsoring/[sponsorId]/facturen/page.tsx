import { InvoiceTable } from "@/components/sponsor-tables";

type PageProps = { params: Promise<{ sponsorId: string }> };

export default async function SponsorFacturenPage({ params }: PageProps) {
  const { sponsorId } = await params;
  return <InvoiceTable sponsorId={sponsorId} />;
}
