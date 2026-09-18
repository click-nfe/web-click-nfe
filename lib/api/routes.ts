function resourceId(id: string) {
  return encodeURIComponent(id);
}

/**
 * Dicionário único das rotas usadas pela aplicação.
 *
 * `backend` representa os blueprints do Flask e só deve ser consumido no
 * servidor Next.js. `bff` representa as rotas same-origin acessíveis pelo
 * navegador.
 */
export const routes = {
  backend: {
    health: "/health",
    auth: {
      login: "/auth/login",
      refresh: "/auth/refresh",
      logout: "/auth/logout",
      me: "/auth/me",
    },
    organization: {
      me: "/organizations/me",
    },
    client: {
      list: "/clients",
      detail: (id: string) => `/clients/${resourceId(id)}`,
      cnpjLookup: (cnpj: string) =>
        `/clients/lookup/cnpj/${resourceId(cnpj)}`,
      fiscalProfile: (id: string) =>
        `/clients/${resourceId(id)}/fiscal-profile`,
    },
    fiscalReference: {
      postalCode: (zipCode: string) =>
        `/fiscal-reference/postal-codes/${resourceId(zipCode)}`,
    },
    importProcess: {
      list: "/import-processes",
      dashboardSummary: "/import-processes/dashboard-summary",
      metadata: "/import-processes/metadata",
      clientGroups: "/import-processes/client-groups",
      detail: (id: string) => `/import-processes/${resourceId(id)}`,
      workflowState: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-workflow-state`,
    },
  },
  bff: {
    health: "/api/health",
    auth: {
      login: "/api/auth/login",
      refresh: "/api/auth/refresh",
      logout: "/api/auth/logout",
    },
    importProcess: {
      list: "/api/import-processes",
      dashboardSummary: "/api/import-processes/summary",
    },
    client: {
      list: "/api/clients",
      detail: (id: string) => `/api/clients/${resourceId(id)}`,
      cnpjLookup: (cnpj: string) =>
        `/api/clients/lookup/cnpj/${resourceId(cnpj)}`,
      fiscalProfile: (id: string) =>
        `/api/clients/${resourceId(id)}/fiscal-profile`,
    },
    fiscalReference: {
      postalCode: (zipCode: string) =>
        `/api/fiscal-reference/postal-codes/${resourceId(zipCode)}`,
    },
  },
} as const;
