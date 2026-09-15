import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { refreshSession } from "@/lib/api/auth";
import { hasApiStatus, logApiError } from "@/lib/api/errors";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function GET(request: NextRequest) {
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL(`/login?expired=1&next=${encodeURIComponent(nextPath)}`, request.url));
  }

  try {
    const { tokens } = await refreshSession(refreshToken);
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    setAuthCookies(response, tokens);
    return response;
  } catch (error) {
    logApiError("auth.refresh", error);

    if (hasApiStatus(error, 400, 401, 403)) {
      const response = NextResponse.redirect(new URL(`/login?expired=1&next=${encodeURIComponent(nextPath)}`, request.url));
      clearAuthCookies(response);
      return response;
    }

    return NextResponse.redirect(new URL(`/login?unavailable=1&next=${encodeURIComponent(nextPath)}`, request.url));
  }
}
