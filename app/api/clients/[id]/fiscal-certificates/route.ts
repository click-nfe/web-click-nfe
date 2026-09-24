import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  listFiscalCertificates,
  uploadFiscalCertificate,
} from "@/lib/api/fiscal-certificate";
import { fiscalCertificateApiErrorResponse } from "@/lib/api/fiscal-certificate-route-helpers";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };
const MAX_REQUEST_BYTES = 2 * 1024 * 1024 + 64 * 1024;

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
    return NextResponse.json(await listFiscalCertificates(token, id));
  } catch (error) {
    return fiscalCertificateApiErrorResponse("client.certificate.list", error);
  }
}

export async function POST(request: NextRequest, context: Context) {
  const token = await accessToken();
  if (!token) {
    return NextResponse.json({ error: "Sessão não encontrada." }, { status: 401 });
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", message: "O certificado ultrapassa o limite de 2 MB." },
      { status: 413 },
    );
  }
  const data = await request.formData().catch(() => null);
  const certificate = data?.get("certificate");
  const password = data?.get("password");
  const environment = data?.get("environment");
  if (
    !(certificate instanceof File) ||
    typeof password !== "string" ||
    !password ||
    environment !== "production"
  ) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Certificado e senha de produção são obrigatórios." },
      { status: 400 },
    );
  }
  if (certificate.size > 2 * 1024 * 1024) {
    return NextResponse.json(
      { error: "file_too_large", message: "O certificado ultrapassa o limite de 2 MB." },
      { status: 413 },
    );
  }
  if (password.length > 1024) {
    return NextResponse.json(
      { error: "invalid_payload", message: "A senha do certificado é inválida." },
      { status: 400 },
    );
  }
  const outgoing = new FormData();
  outgoing.set("certificate", certificate, certificate.name);
  outgoing.set("password", password);
  outgoing.set("environment", environment);
  const { id } = await context.params;
  try {
    return NextResponse.json(
      await uploadFiscalCertificate(token, id, outgoing),
      { status: 201 },
    );
  } catch (error) {
    return fiscalCertificateApiErrorResponse("client.certificate.upload", error);
  }
}
