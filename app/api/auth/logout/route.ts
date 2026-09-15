import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE, clearAuthCookies } from "@/lib/auth-cookies";
import { logout } from "@/lib/api/auth";
import { logApiError } from "@/lib/api/errors";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    try {
      await logout(accessToken);
    } catch (error) {
      logApiError("auth.logout", error);
      // A sessão local deve ser encerrada mesmo se a API estiver indisponível.
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
