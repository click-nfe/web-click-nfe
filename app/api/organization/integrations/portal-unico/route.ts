import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  configurePortalUnico,
  getPortalUnicoSettings,
  type ConfigurePortalUnicoPayload,
} from "@/lib/api/organization";
import { organizationApiErrorResponse } from "@/lib/api/organization-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePayload(value: unknown): ConfigurePortalUnicoPayload | null {
  if (!isObject(value)) return null;
  if (
    typeof value.client_id !== "string" ||
    typeof value.client_secret !== "string"
  ) {
    return null;
  }

  const clientId = value.client_id.trim();
  const clientSecret = value.client_secret;
  if (
    !clientId ||
    !clientSecret.trim() ||
    clientId.length > 512 ||
    clientSecret.length > 2048
  ) {
    return null;
  }
  return { client_id: clientId, client_secret: clientSecret };
}

async function accessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function GET() {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  try {
    return NextResponse.json(await getPortalUnicoSettings(token));
  } catch (error) {
    return organizationApiErrorResponse("organization.portal-unico.get", error);
  }
}

export async function PUT(request: NextRequest) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json(
      {
        error: "invalid_payload",
        message: "Informe um Client-Id e um Client-Secret válidos.",
      },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(await configurePortalUnico(token, payload));
  } catch (error) {
    return organizationApiErrorResponse("organization.portal-unico.configure", error);
  }
}
