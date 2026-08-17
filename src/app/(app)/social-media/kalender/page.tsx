import { PageHeader } from "@/components/page-header";
import { SocialCalendar } from "@/components/social-calendar";

export default function SocialKalenderPage() {
  return (
    <>
      <PageHeader
        title="Kalender"
        description="Plan social posts per dag. Klik op een datum om iets in te plannen."
      />
      <SocialCalendar />
    </>
  );
}
