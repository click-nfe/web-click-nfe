import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth-cookies";
import { login } from "@/lib/api/auth";
import { apiUnavailableMessage, hasApiStatus, logApiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  let credentials: unknown;

  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  if (
    !credentials ||
    typeof credentials !== "object" ||
    !("email" in credentials) ||
    !("password" in credentials) ||
    typeof credentials.email !== "string" ||
    typeof credentials.password !== "string"
  ) {
    return NextResponse.json({ error: "Informe e-mail e senha." }, { status: 400 });
  }

  try {
    const data = await login(credentials.email, credentials.password);
    const response = NextResponse.json({ user: data.user });
    setAuthCookies(response, data.tokens);
    return response;
  } catch (error) {
    logApiError("auth.login", error);

    if (hasApiStatus(error, 401)) {
      return NextResponse.json({ error: "E-mail ou senha inválidos." }, { status: 401 });
    }

    return NextResponse.json(
      { error: apiUnavailableMessage(error) },
      { status: 502 },
    );
  }
}
