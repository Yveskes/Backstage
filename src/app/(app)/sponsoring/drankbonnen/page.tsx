import { PageHeader } from "@/components/page-header";
import { BenefitTable } from "@/components/sponsor-tables";

export default function DrankbonnenPage() {
  return (
    <>
      <PageHeader
        title="Drankbonnen"
        description="Drankbonnen hangen vast aan een sponsor. Klik door naar de sponsorpagina voor de details."
      />
      <BenefitTable type="drankbonnen" />
    </>
  );
}
