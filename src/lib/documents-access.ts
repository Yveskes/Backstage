import { createAdminClient } from "@/lib/supabase/admin";
import { createSessionClient } from "@/lib/supabase/session";
import { isAdminEmail } from "@/lib/env";
import { sanitizeModules } from "@/lib/permissions";

export async function canAccessDocuments() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? "";
  if (!email) {
    return false;
  }

  if (isAdminEmail(email)) {
    return true;
  }

  const client = createAdminClient() ?? supabase;
  const { data } = await client
    .from("profiles")
    .select("user_kind, modules")
    .eq("email", email)
    .maybeSingle();

  if (data?.user_kind === "admin") {
    return true;
  }

  if (data?.user_kind === "staff") {
    return false;
  }

  return sanitizeModules(data?.modules).includes("documenten");
}
