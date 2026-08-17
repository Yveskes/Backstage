import { PageHeader } from "@/components/page-header";
import { InvoiceTable } from "@/components/sponsor-tables";

export default function FacturenPage() {
  return (
    <>
      <PageHeader
        title="Facturen"
        description="Alle facturen, gekoppeld aan een sponsor. Open een sponsor om de details te zien."
      />
      <InvoiceTable />
    </>
  );
}
