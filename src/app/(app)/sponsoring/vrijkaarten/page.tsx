import { PageHeader } from "@/components/page-header";
import { BenefitTable } from "@/components/sponsor-tables";

export default function VrijkaartenPage() {
  return (
    <>
      <PageHeader
        title="Vrijkaarten"
        description="Vrijkaarten hangen vast aan een sponsor. Klik door naar de sponsorpagina voor de details."
      />
      <BenefitTable type="vrijkaarten" />
    </>
  );
}
