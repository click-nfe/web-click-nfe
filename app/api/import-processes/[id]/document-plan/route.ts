import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  createNfeDocumentPlan,
  type CreateNfeDocumentPlanPayload,
  getNfeDocumentPlan,
} from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const costNames = ["afrmm", "siscomex_fee", "thc", "other"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePayload(value: unknown): CreateNfeDocumentPlanPayload | null {
  if (
    !isObject(value) ||
    typeof value.duimp_snapshot_id !== "string" ||
    !value.duimp_snapshot_id.trim() ||
    !isObject(value.additional_costs)
  ) {
    return null;
  }

  const additionalCosts: CreateNfeDocumentPlanPayload["additional_costs"] = {};
  for (const [name, rawValue] of Object.entries(value.additional_costs)) {
    if (!costNames.includes(name as (typeof costNames)[number])) return null;
    if (typeof rawValue !== "string" && typeof rawValue !== "number") return null;
    const normalized = String(rawValue).trim().replace(",", ".");
    if (!normalized || !Number.isFinite(Number(normalized)) || Number(normalized) < 0) {
      return null;
    }
    additionalCosts[name as (typeof costNames)[number]] = normalized;
  }

  return {
    duimp_snapshot_id: value.duimp_snapshot_id.trim(),
    additional_costs: additionalCosts,
  };
}

async function accessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function GET(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const { id } = await context.params;
  const snapshotId = request.nextUrl.searchParams.get("duimp_snapshot_id") || undefined;
  try {
    return NextResponse.json(await getNfeDocumentPlan(token, id, snapshotId));
  } catch (error) {
    return importProcessApiErrorResponse("import-process.document-plan.get", error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Revise o snapshot e os valores das despesas compartilhadas." },
      { status: 400 },
    );
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(await createNfeDocumentPlan(token, id, payload), { status: 201 });
  } catch (error) {
    return importProcessApiErrorResponse("import-process.document-plan.create", error);
  }
}
