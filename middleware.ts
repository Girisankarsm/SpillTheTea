import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, verifySessionToken } from "@/lib/auth/session-token";

function loginRedirect(request: NextRequest, nextPath?: string) {
  const loginUrl = new URL("/login", request.url);
  if (nextPath && nextPath !== "/") {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/auth/callback") || pathname.startsWith("/api/auth")) {
    return NextResponse.next({ request });
  }

  if (pathname === "/api/health") {
    return NextResponse.next({ request });
  }

  if (pathname === "/manifest.webmanifest" || pathname === "/sw.js") {
    return NextResponse.next({ request });
  }

  const user = await verifySessionToken(request.cookies.get(AUTH_COOKIE)?.value);

  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/privacy" ||
    pathname === "/terms"
  ) {
    if (pathname === "/" && user) {
      return NextResponse.redirect(new URL("/topics", request.url));
    }
    return NextResponse.next({ request });
  }

  if (!user) return loginRedirect(request, pathname);

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
