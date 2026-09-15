import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth-cookies";
import { backendFetch, type LoginResponse } from "@/lib/backend";

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
    const apiResponse = await backendFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

    if (!apiResponse.ok) {
      const status = apiResponse.status === 401 ? 401 : 502;
      return NextResponse.json(
        { error: status === 401 ? "E-mail ou senha inválidos." : "Não foi possível entrar agora." },
        { status },
      );
    }

    const data = (await apiResponse.json()) as LoginResponse;
    const response = NextResponse.json({ user: data.user });
    setAuthCookies(response, data.tokens);
    return response;
  } catch {
    return NextResponse.json(
      { error: "A API não está disponível. Confirme se o container está em execução." },
      { status: 502 },
    );
  }
}
