import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { updateUser, type UserPayload } from "@/lib/api/users";
import { organizationApiErrorResponse } from "@/lib/api/organization-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
  try { return NextResponse.json(await updateUser(token, (await params).id, body as UserPayload)); }
  catch (error) { return organizationApiErrorResponse("users.update", error); }
}
