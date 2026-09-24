import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { listDuimpSnapshots, type DuimpSnapshotDetails } from "@/lib/api/import-process";
import { importProcessApiErrorResponse } from "@/lib/api/import-process-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string; snapshotId: string }> };

export async function GET(_request: Request, context: Context) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });

  const { id, snapshotId } = await context.params;
  try {
    const snapshots = await listDuimpSnapshots(token, id);
    const snapshot = snapshots.find((item) => item.id === snapshotId);
    if (!snapshot) {
      return NextResponse.json(
        { error: "not_found", message: "Captura da DUIMP não encontrada." },
        { status: 404 },
      );
    }

    const response: DuimpSnapshotDetails = {
      id: snapshot.id,
      import_process_id: snapshot.import_process_id,
      duimp_number: snapshot.duimp_number,
      duimp_version: snapshot.duimp_version,
      source_provider: snapshot.source_provider,
      fetched_at: snapshot.fetched_at,
      created_at: snapshot.created_at,
      normalized: snapshot.normalized_payload ?? {},
    };
    return NextResponse.json(response);
  } catch (error) {
    return importProcessApiErrorResponse("import-process.duimp-snapshot.get", error);
  }
}
