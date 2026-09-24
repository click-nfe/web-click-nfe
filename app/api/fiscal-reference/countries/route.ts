import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { searchCountries } from "@/lib/api/fiscal-reference";
import { fiscalReferenceApiErrorResponse } from "@/lib/api/fiscal-reference-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const activeOn = request.nextUrl.searchParams.get("active_on")?.trim();
  if (
    query.length < 2 ||
    query.length > 120 ||
    (activeOn && !/^\d{4}-\d{2}-\d{2}$/.test(activeOn))
  ) {
    return NextResponse.json(
      { error: "invalid_query", message: "Digite ao menos 2 caracteres para pesquisar o país." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await searchCountries(token, query, activeOn));
  } catch (error) {
    return fiscalReferenceApiErrorResponse("fiscal-reference.countries", error);
  }
}
