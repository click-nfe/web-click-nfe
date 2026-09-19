import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getClientImportTaxRuleDiagnostics } from "@/lib/api/client-import-tax-rule";
import { taxRuleApiErrorResponse } from "@/lib/api/client-import-tax-rule-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    return NextResponse.json(
      await getClientImportTaxRuleDiagnostics(token, id),
    );
  } catch (error) {
    return taxRuleApiErrorResponse("client.import-tax-rule.diagnostics", error);
  }
}
