import { PageHeader } from "@/components/page-header";
import { SocialPostsBoard } from "@/components/social-posts-board";

export default function SocialPostsPage() {
  return (
    <>
      <PageHeader
        title="Posts"
        description="Upload foto's en video's voor Instagram, Facebook, TikTok of stories."
      />
      <SocialPostsBoard />
    </>
  );
}
