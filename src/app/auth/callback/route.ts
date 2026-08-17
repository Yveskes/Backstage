import { createSessionClient } from "@/lib/supabase/session";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createSessionClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirectUrl = new URL(next, url.origin);
  if (redirectUrl.origin !== url.origin) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  return NextResponse.redirect(redirectUrl);
}
