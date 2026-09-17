import { CircleHelp } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser, type UserIdentity } from "@/lib/api/auth";
import { hasApiStatus, logApiError } from "@/lib/api/errors";
import { getCurrentOrganization, type Organization } from "@/lib/api/organization";
import { ACCESS_COOKIE } from "@/lib/auth-cookies";

type DashboardSession =
  | { state: "ready"; user: UserIdentity; organization: Organization }
  | { state: "unavailable" };

async function getDashboardSession(): Promise<DashboardSession> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    redirect("/api/auth/refresh?next=/dashboard");
  }

  try {
    const [user, organization] = await Promise.all([
      getCurrentUser(accessToken),
      getCurrentOrganization(accessToken),
    ]);
    return { state: "ready", user, organization };
  } catch (error) {
    logApiError("dashboard.session", error);
    if (hasApiStatus(error, 401, 403)) {
      redirect("/api/auth/refresh?next=/dashboard");
    }
    return { state: "unavailable" };
  }
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getDashboardSession();

  if (session.state === "unavailable") {
    return (
      <main className="grid min-h-screen place-items-center px-5">
        <div className="surface-card max-w-md p-8 text-center">
          <CircleHelp className="mx-auto text-sage-strong" size={30} />
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight">Não foi possível carregar o painel.</h1>
          <p className="mt-3 leading-7 text-muted-foreground">Confirme se a API e o PostgreSQL estão em execução e tente novamente.</p>
          <Link href="/dashboard" className="button button-primary mt-7">Tentar novamente</Link>
        </div>
      </main>
    );
  }

  return (
    <DashboardShell user={session.user} organization={session.organization}>
      {children}
    </DashboardShell>
  );
}
