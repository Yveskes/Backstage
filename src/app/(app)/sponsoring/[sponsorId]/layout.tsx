import { SponsorHeader } from "@/components/sponsor-header";
import { SponsorTabs } from "@/components/sponsor-tabs";
import { getSponsor } from "@/lib/sponsors";
import { notFound } from "next/navigation";

type SponsorLayoutProps = LayoutProps<"/sponsoring/[sponsorId]">;

export default async function SponsorLayout({ children, params }: SponsorLayoutProps) {
  const { sponsorId } = await params;
  const sponsor = getSponsor(sponsorId);

  if (!sponsor) {
    notFound();
  }

  return (
    <div>
      <SponsorHeader sponsorId={sponsorId} />
      <SponsorTabs sponsorId={sponsorId} />
      {children}
    </div>
  );
}
