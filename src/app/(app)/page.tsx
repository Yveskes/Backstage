import { HomeFeed } from "@/components/home-feed";
import { testSupabaseConnection } from "@/lib/supabase/test-connection";

export default async function DashboardPage() {
  const connection = await testSupabaseConnection();

  return <HomeFeed showModules connection={connection} />;
}
