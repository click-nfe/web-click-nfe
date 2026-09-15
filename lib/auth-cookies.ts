import type { NextResponse } from "next/server";

const secure = process.env.NODE_ENV === "production";
const prefix = secure ? "__Host-" : "";

export const ACCESS_COOKIE = `${prefix}click_nfe_access`;
export const REFRESH_COOKIE = `${prefix}click_nfe_refresh`;

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  const common = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...common,
    maxAge: tokens.expiresIn,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...common,
    maxAge: Number(process.env.REFRESH_TOKEN_MAX_AGE_SECONDS ?? 604800),
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
}
