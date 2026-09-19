import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  deactivateClientImportTaxRule,
  updateClientImportTaxRule,
} from "@/lib/api/client-import-tax-rule";
import {
  invalidTaxRulePayloadResponse,
  readTaxRuleJson,
  taxRuleApiErrorResponse,
} from "@/lib/api/client-import-tax-rule-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; ruleId: string }> };

async function accessToken() {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function PUT(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const payload = await readTaxRuleJson(request);
  if (!payload) return invalidTaxRulePayloadResponse();
  const { id, ruleId } = await context.params;
  try {
    return NextResponse.json(
      await updateClientImportTaxRule(token, id, ruleId, payload),
    );
  } catch (error) {
    return taxRuleApiErrorResponse("client.import-tax-rule.update", error);
  }
}

export async function DELETE(_request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const { id, ruleId } = await context.params;
  try {
    await deactivateClientImportTaxRule(token, id, ruleId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return taxRuleApiErrorResponse("client.import-tax-rule.deactivate", error);
  }
}
