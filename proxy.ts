import { NextRequest, NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookies";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasAccessToken = request.cookies.has(ACCESS_COOKIE);
  const hasRefreshToken = request.cookies.has(REFRESH_COOKIE);

  if (pathname.startsWith("/dashboard") && !hasAccessToken) {
    const nextPath = `${pathname}${search}`;
    if (hasRefreshToken) {
      return NextResponse.redirect(
        new URL(`/api/auth/refresh?next=${encodeURIComponent(nextPath)}`, request.url),
      );
    }

    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(nextPath)}`, request.url),
    );
  }

  if (pathname === "/login" && hasAccessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
