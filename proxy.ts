import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ---------------------------------------------------------
  // ROUTE GROUPS
  // ---------------------------------------------------------

  const adminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/influencers") ||
    pathname.startsWith("/collaboration-requests");

  const creatorRoute =
    pathname === "/creator" ||
    pathname.startsWith("/creator/");

  // ---------------------------------------------------------
  // LOGGED-OUT PROTECTION
  // ---------------------------------------------------------

  if ((adminRoute || creatorRoute) && !user) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // ---------------------------------------------------------
  // LOGIN PAGE
  // ---------------------------------------------------------

  if (pathname === "/login" && user) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  // ---------------------------------------------------------
  // ROLE CHECK
  // ---------------------------------------------------------

  if (user && (adminRoute || creatorRoute)) {
    const { data: roleRecord } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleRecord) {
      return NextResponse.redirect(
        new URL("/login?error=no_role", request.url)
      );
    }

    // Creator trying to access an Admin route
    if (adminRoute && roleRecord.role === "creator") {
      return NextResponse.redirect(
        new URL("/creator", request.url)
      );
    }

    // Admin trying to access a Creator route
    if (creatorRoute && roleRecord.role === "admin") {
      return NextResponse.redirect(
        new URL("/admin", request.url)
      );
    }

    // Unknown role
    if (
      roleRecord.role !== "admin" &&
      roleRecord.role !== "creator"
    ) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_role", request.url)
      );
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/influencers/:path*",
    "/collaboration-requests/:path*",
    "/creator/:path*",
    "/login",
  ],
};