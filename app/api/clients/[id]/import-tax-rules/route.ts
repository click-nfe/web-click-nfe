import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  createClientImportTaxRule,
  listClientImportTaxRules,
} from "@/lib/api/client-import-tax-rule";
import {
  invalidTaxRulePayloadResponse,
  readTaxRuleJson,
  taxRuleApiErrorResponse,
} from "@/lib/api/client-import-tax-rule-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

async function accessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function GET(_request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(await listClientImportTaxRules(token, id));
  } catch (error) {
    return taxRuleApiErrorResponse("client.import-tax-rule.list", error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const payload = await readTaxRuleJson(request);
  if (!payload) return invalidTaxRulePayloadResponse();
  const { id } = await context.params;
  try {
    return NextResponse.json(
      await createClientImportTaxRule(token, id, payload),
      { status: 201 },
    );
  } catch (error) {
    return taxRuleApiErrorResponse("client.import-tax-rule.create", error);
  }
}
