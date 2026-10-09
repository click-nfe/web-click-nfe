import axios from "axios";
import { NextResponse } from "next/server";

import { registerOrganization, type Registration } from "@/lib/api/auth";
import { apiUnavailableMessage, logApiError } from "@/lib/api/errors";

export async function POST(request: Request) {
  let values: Registration;
  try {
    values = await request.json();
  } catch {
    return NextResponse.json({ error: "Preencha os dados do cadastro." }, { status: 400 });
  }
  const required = ["organization_name", "organization_slug", "name", "email", "password"] as const;
  if (!values || typeof values !== "object" || required.some((key) => typeof values[key] !== "string")) {
    return NextResponse.json({ error: "Preencha todos os campos do cadastro." }, { status: 400 });
  }

  try {
    const result = await registerOrganization(Object.fromEntries(
      required.map((key) => [key, values[key]]),
    ) as Registration);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logApiError("auth.register", error);
    if (axios.isAxiosError<{ message?: string }>(error) && [400, 409, 413].includes(error.response?.status ?? 0)) {
      return NextResponse.json(
        { error: error.response?.data?.message ?? "Revise os dados informados." },
        { status: error.response!.status },
      );
    }
    return NextResponse.json({ error: apiUnavailableMessage(error) }, { status: 502 });
  }
}
