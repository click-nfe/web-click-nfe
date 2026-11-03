import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import { prepareSimplifiedProcess } from "@/lib/api/simplified-issuance";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  try {
    const body = await request.json();
    return NextResponse.json(await prepareSimplifiedProcess(token, (await params).id, body));
  } catch (error) { return clientApiErrorResponse("importProcess.simplified.prepare", error); }
}
