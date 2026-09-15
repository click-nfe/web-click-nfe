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
    importProcess: {
      list: "/import-processes",
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
  },
} as const;
