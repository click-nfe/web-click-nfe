import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrganization, updateCurrentOrganization, type OrganizationUpdate } from "@/lib/api/organization";
import { organizationApiErrorResponse } from "@/lib/api/organization-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  try { return NextResponse.json(await getCurrentOrganization(token)); }
  catch (error) { return organizationApiErrorResponse("organization.get", error); }
}

export async function PATCH(request: NextRequest) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  const payload = body as OrganizationUpdate;
  try { return NextResponse.json(await updateCurrentOrganization(token, payload)); }
  catch (error) { return organizationApiErrorResponse("organization.update", error); }
}
