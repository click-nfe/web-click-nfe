import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { simulateClientImportTaxRule } from "@/lib/api/client-import-tax-rule";
import {
  invalidTaxRulePayloadResponse,
  readTaxRuleJson,
  taxRuleApiErrorResponse,
} from "@/lib/api/client-import-tax-rule-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const payload = await readTaxRuleJson(request);
  if (!payload) return invalidTaxRulePayloadResponse();
  const { id } = await context.params;
  try {
    return NextResponse.json(
      await simulateClientImportTaxRule(token, id, payload),
    );
  } catch (error) {
    return taxRuleApiErrorResponse("client.import-tax-rule.simulate", error);
  }
}
