import { SponsorOverview } from "@/components/sponsor-overview";

type SponsorPageProps = PageProps<"/sponsoring/[sponsorId]">;

export default async function SponsorPage({ params }: SponsorPageProps) {
  const { sponsorId } = await params;
  return <SponsorOverview sponsorId={sponsorId} />;
}
