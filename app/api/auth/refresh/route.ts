import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { backendFetch, type AuthTokens } from "@/lib/backend";

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
    const apiResponse = await backendFetch("/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!apiResponse.ok) {
      const response = NextResponse.redirect(new URL(`/login?expired=1&next=${encodeURIComponent(nextPath)}`, request.url));
      clearAuthCookies(response);
      return response;
    }

    const { tokens } = (await apiResponse.json()) as { tokens: AuthTokens };
    const response = NextResponse.redirect(new URL(nextPath, request.url));
    setAuthCookies(response, tokens);
    return response;
  } catch {
    return NextResponse.redirect(new URL(`/login?unavailable=1&next=${encodeURIComponent(nextPath)}`, request.url));
  }
}
