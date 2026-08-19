import { SponsorInvoiceDocument } from "@/components/sponsor-invoice-document";

type PageProps = { params: Promise<{ sponsorId: string; invoiceId: string }> };

export default async function SponsorInvoicePage({ params }: PageProps) {
  const { sponsorId, invoiceId } = await params;
  return <SponsorInvoiceDocument sponsorId={sponsorId} invoiceId={invoiceId} />;
}
