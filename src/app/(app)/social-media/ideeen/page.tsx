import { PageHeader } from "@/components/page-header";
import { SocialIdeasBoard } from "@/components/social-ideas-board";

export default function SocialIdeeenPage() {
  return (
    <>
      <PageHeader
        title="Ideeën"
        description="Verzamel contentideeën. Een screenshot of korte video mag erbij."
      />
      <SocialIdeasBoard />
    </>
  );
}
