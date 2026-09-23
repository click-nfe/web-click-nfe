"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { UserIdentity } from "@/lib/api/auth";
import type { Organization } from "@/lib/api/organization";

type DashboardSession = {
  user: UserIdentity;
  organization: Organization;
};

const DashboardSessionContext = createContext<DashboardSession | null>(null);

export function DashboardSessionProvider({
  value,
  children,
}: {
  value: DashboardSession;
  children: ReactNode;
}) {
  return (
    <DashboardSessionContext.Provider value={value}>
      {children}
    </DashboardSessionContext.Provider>
  );
}

export function useDashboardSession() {
  const session = useContext(DashboardSessionContext);
  if (!session) {
    throw new Error("useDashboardSession deve ser usado dentro do dashboard.");
  }
  return session;
}
