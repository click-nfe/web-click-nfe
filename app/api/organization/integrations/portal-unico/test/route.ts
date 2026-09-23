import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { testPortalUnicoConnection } from "@/lib/api/organization";
import { organizationApiErrorResponse } from "@/lib/api/organization-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  try {
    return NextResponse.json(await testPortalUnicoConnection(token));
  } catch (error) {
    return organizationApiErrorResponse("organization.portal-unico.test", error);
  }
}
