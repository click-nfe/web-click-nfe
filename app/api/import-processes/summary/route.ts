import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ACCESS_COOKIE } from "@/lib/auth-cookies";
import { apiUnavailableMessage, hasApiStatus, logApiError } from "@/lib/api/errors";
import { getImportProcessDashboardSummary } from "@/lib/api/import-process";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }

  try {
    return NextResponse.json(
      await getImportProcessDashboardSummary(accessToken),
    );
  } catch (error) {
    logApiError("import-process.dashboard-summary", error);

    if (hasApiStatus(error, 401, 403)) {
      return NextResponse.json({ error: "Sessão expirada." }, { status: 401 });
    }
    return NextResponse.json(
      { error: apiUnavailableMessage(error) },
      { status: 502 },
    );
  }
}
