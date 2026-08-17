import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return Response.json({ ok: false, reason: "missing_service_role" }, { status: 500 });
  }

  const now = new Date().toISOString();

  await admin
    .from("invites")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", now);

  await admin.from("invites").delete().lte("purge_at", now);

  return Response.json({ ok: true });
}
