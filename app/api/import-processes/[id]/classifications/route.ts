import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import type { ImportPurpose } from "@/lib/api/client-import-tax-rule";
import {
  getNfeItemClassifications,
  type SaveNfeItemClassificationsPayload,
  saveNfeItemClassifications,
} from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const purposes = new Set<ImportPurpose>([
  "resale",
  "industrialization",
  "fixed_asset",
  "use_consumption",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parsePayload(value: unknown): SaveNfeItemClassificationsPayload | null {
  if (
    !isObject(value) ||
    typeof value.duimp_snapshot_id !== "string" ||
    !value.duimp_snapshot_id.trim() ||
    !Array.isArray(value.items) ||
    value.items.length === 0
  ) {
    return null;
  }

  const items: SaveNfeItemClassificationsPayload["items"] = [];
  const itemNumbers = new Set<string>();
  for (const item of value.items) {
    if (
      !isObject(item) ||
      typeof item.duimp_item_number !== "string" ||
      !item.duimp_item_number.trim() ||
      typeof item.import_purpose !== "string" ||
      !purposes.has(item.import_purpose as ImportPurpose) ||
      (item.tax_rule_id !== undefined && typeof item.tax_rule_id !== "string")
    ) {
      return null;
    }
    const itemNumber = item.duimp_item_number.trim();
    if (itemNumbers.has(itemNumber)) return null;
    itemNumbers.add(itemNumber);
    items.push({
      duimp_item_number: itemNumber,
      import_purpose: item.import_purpose as ImportPurpose,
      ...(typeof item.tax_rule_id === "string" && item.tax_rule_id.trim()
        ? { tax_rule_id: item.tax_rule_id.trim() }
        : {}),
    });
  }

  return { duimp_snapshot_id: value.duimp_snapshot_id.trim(), items };
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
    return NextResponse.json(await getNfeItemClassifications(token, id, snapshotId));
  } catch (error) {
    return importProcessApiErrorResponse("import-process.classifications.get", error);
  }
}

export async function PUT(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  const payload = parsePayload(await request.json().catch(() => null));
  if (!payload) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Informe a finalidade de todos os itens selecionados." },
      { status: 400 },
    );
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(await saveNfeItemClassifications(token, id, payload));
  } catch (error) {
    return importProcessApiErrorResponse("import-process.classifications.save", error);
  }
}
