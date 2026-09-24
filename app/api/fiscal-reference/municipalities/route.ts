import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { searchMunicipalities } from "@/lib/api/fiscal-reference";
import { fiscalReferenceApiErrorResponse } from "@/lib/api/fiscal-reference-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const state = request.nextUrl.searchParams.get("state")?.trim().toUpperCase();
  if (query.length < 2 || query.length > 120 || (state && !/^[A-Z]{2}$/.test(state))) {
    return NextResponse.json(
      { error: "invalid_query", message: "Digite ao menos 2 caracteres para pesquisar o município." },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(await searchMunicipalities(token, query, state));
  } catch (error) {
    return fiscalReferenceApiErrorResponse("fiscal-reference.municipalities", error);
  }
}
