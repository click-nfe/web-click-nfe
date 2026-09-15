import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE, clearAuthCookies } from "@/lib/auth-cookies";
import { backendFetch, bearerHeaders } from "@/lib/backend";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    try {
      await backendFetch("/auth/logout", {
        method: "POST",
        headers: bearerHeaders(accessToken),
      });
    } catch {
      // A sessão local deve ser encerrada mesmo se a API estiver indisponível.
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
