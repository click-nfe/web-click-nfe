import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createUser, listUsers, type UserPayload } from "@/lib/api/users";
import { organizationApiErrorResponse } from "@/lib/api/organization-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";
export async function GET() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  try { return NextResponse.json(await listUsers(token)); }
  catch (error) { return organizationApiErrorResponse("users.list", error); }
}
export async function POST(request: NextRequest) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  try { return NextResponse.json(await createUser(token, body as UserPayload), { status: 201 }); }
  catch (error) { return organizationApiErrorResponse("users.create", error); }
}
