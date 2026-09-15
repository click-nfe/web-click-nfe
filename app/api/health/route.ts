import { NextResponse } from "next/server";

import { apiUnavailableMessage, logApiError } from "@/lib/api/errors";
import { getApiHealth } from "@/lib/api/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const api = await getApiHealth();
    return NextResponse.json({ status: "ok", api });
  } catch (error) {
    logApiError("health", error);
    return NextResponse.json(
      {
        status: "error",
        api: { status: "unavailable" },
        error: apiUnavailableMessage(error),
      },
      { status: 502 },
    );
  }
}
