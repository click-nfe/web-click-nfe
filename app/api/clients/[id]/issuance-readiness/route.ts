import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getClientFiscalProfile } from "@/lib/api/client-fiscal-profile";
import { getClientImportTaxRuleDiagnostics } from "@/lib/api/client-import-tax-rule";
import type { ClientIssuanceReadinessSnapshot } from "@/lib/api/client-issuance-readiness";
import { clientApiErrorResponse } from "@/lib/api/client-route-helpers";
import { hasApiStatus } from "@/lib/api/errors";
import { listFiscalCertificates } from "@/lib/api/fiscal-certificate";
import { listNfeNumberSequences } from "@/lib/api/nfe-number-sequence";
import { getPortalUnicoSettings } from "@/lib/api/organization";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const;

async function optionalFiscalProfile(accessToken: string, clientId: string) {
  try {
    return await getClientFiscalProfile(accessToken, clientId);
  } catch (error) {
    if (hasApiStatus(error, 404)) return null;
    throw error;
  }
}

export async function GET(_request: NextRequest, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { error: "Sessão não encontrada." },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  const { id } = await context.params;
  try {
    const [fiscalProfile, certificates, taxRules, numberSequences, portal] =
      await Promise.all([
        optionalFiscalProfile(token, id),
        listFiscalCertificates(token, id),
        getClientImportTaxRuleDiagnostics(token, id),
        listNfeNumberSequences(token, id),
        getPortalUnicoSettings(token),
      ]);

    const snapshot: ClientIssuanceReadinessSnapshot = {
      client_id: id,
      environment: "production",
      has_fiscal_profile: Boolean(fiscalProfile),
      active_sequence:
        numberSequences.find(
          (item) =>
            item.environment === "production" &&
            item.model === "55" &&
            item.status === "active",
        ) ?? null,
      has_portal_connection:
        portal.environment === "production" && portal.ready_for_duimp,
      active_tax_rules: taxRules.summary.active,
      tax_rule_conflicts: taxRules.summary.conflict_count,
      active_certificate:
        certificates.find(
          (item) =>
            item.environment === "production" &&
            item.status === "active" &&
            item.is_active,
        ) ?? null,
      refreshed_at: new Date().toISOString(),
    };

    return NextResponse.json(snapshot, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const response = clientApiErrorResponse("client.issuance-readiness.get", error);
    response.headers.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);
    return response;
  }
}
