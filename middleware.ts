import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticatedUser } from "@/lib/supabase/session";

function loginRedirect(request: NextRequest, nextPath?: string) {
  const loginUrl = new URL("/login", request.url);
  if (nextPath && nextPath !== "/") {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next({ request });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const configured = Boolean(url?.trim() && anonKey?.trim());

  if (pathname === "/login") {
    if (!configured) {
      return NextResponse.next({ request });
    }

    let response = NextResponse.next({ request });
    const supabase = createServerClient(url!, anonKey!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isAuthenticatedUser(user)) {
      const next = request.nextUrl.searchParams.get("next");
      const destination =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    return response;
  }

  if (!configured) {
    return loginRedirect(request, pathname);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAuthenticatedUser(user)) {
    return loginRedirect(request, pathname);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
