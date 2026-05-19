import { NextResponse } from "next/server";
import { hasValidLegalAcceptanceCookie, LEGAL_ACCEPT_COOKIE } from "@/lib/legal-acceptance";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const cookieHeader = request.headers.get("cookie");

  if (code) {
    const supabase = await createServerSupabaseClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        if (!hasValidLegalAcceptanceCookie(cookieHeader)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?auth=legal`);
        }

        const response = NextResponse.redirect(`${origin}${next}`);
        response.cookies.set(LEGAL_ACCEPT_COOKIE, "", { path: "/", maxAge: 0 });
        return response;
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?auth=failed`);
}
