import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, siteOrigin } from "@/lib/supabase/server";
import { callbackDestination } from "@/lib/community/validation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const destination = callbackDestination(
    request.nextUrl.searchParams.get("next"),
  );
  const origin = siteOrigin();
  if (code || (tokenHash && type === "email")) {
    try {
      const supabase = await createSupabaseServer();
      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : await supabase.auth.verifyOtp({
            token_hash: tokenHash!,
            type: "email",
          });
      if (!error)
        return NextResponse.redirect(
          new URL(
            destination === "/konto" ? "/konto?welcome=1" : destination,
            origin,
          ),
          { headers: { "Cache-Control": "private, no-store" } },
        );
    } catch {
      /* Show a retry instruction without exposing provider details. */
    }
  }
  return NextResponse.redirect(new URL("/konto?error=confirmation", origin), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
