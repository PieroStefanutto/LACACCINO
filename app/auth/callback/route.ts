import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, siteOrigin } from "@/lib/supabase/server";
import { callbackDestination } from "@/lib/community/validation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = callbackDestination(request.nextUrl.searchParams.get("next"));
  const origin = siteOrigin();
  if (code) {
    try {
      const supabase = await createSupabaseServer();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(destination, origin), { headers: { "Cache-Control": "private, no-store" } });
    } catch { /* Show a retry instruction without exposing provider details. */ }
  }
  return NextResponse.redirect(new URL("/konto?error=confirmation", origin), { headers: { "Cache-Control": "private, no-store" } });
}
