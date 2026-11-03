import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import { startSimplifiedProcess } from "@/lib/api/simplified-issuance";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try { return NextResponse.json(await startSimplifiedProcess(token, (await params).id, String((await request.json().catch(() => ({}))).duimp_number ?? "")), { status: 201 }); }
  catch (error) { return clientApiErrorResponse("client.simplified.start", error); }
}
