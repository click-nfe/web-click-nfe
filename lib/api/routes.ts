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
      portalUnico: "/organizations/me/integrations/portal-unico",
      portalUnicoTest: "/organizations/me/integrations/portal-unico/test",
    },
    client: {
      list: "/clients",
      detail: (id: string) => `/clients/${resourceId(id)}`,
      cnpjLookup: (cnpj: string) =>
        `/clients/lookup/cnpj/${resourceId(cnpj)}`,
      fiscalProfile: (id: string) =>
        `/clients/${resourceId(id)}/fiscal-profile`,
      fiscalCertificates: (id: string) =>
        `/clients/${resourceId(id)}/fiscal-certificates`,
      fiscalCertificateUpload: (id: string) =>
        `/clients/${resourceId(id)}/fiscal-certificates/upload`,
      fiscalCertificateValidate: (id: string, certificateId: string) =>
        `/clients/${resourceId(id)}/fiscal-certificates/${resourceId(certificateId)}/validate`,
      fiscalCertificateActivate: (id: string, certificateId: string) =>
        `/clients/${resourceId(id)}/fiscal-certificates/${resourceId(certificateId)}/activate`,
      importTaxRules: (id: string) =>
        `/clients/${resourceId(id)}/import-tax-rules`,
      importTaxRule: (id: string, ruleId: string) =>
        `/clients/${resourceId(id)}/import-tax-rules/${resourceId(ruleId)}`,
      importTaxRuleDiagnostics: (id: string) =>
        `/clients/${resourceId(id)}/import-tax-rules/diagnostics`,
      importTaxRuleSimulation: (id: string) =>
        `/clients/${resourceId(id)}/import-tax-rules/simulate`,
      nfeNumberSequences: (id: string) =>
        `/clients/${resourceId(id)}/nfe-number-sequences`,
    },
    fiscalReference: {
      postalCode: (zipCode: string) =>
        `/fiscal-reference/postal-codes/${resourceId(zipCode)}`,
      municipalities: "/fiscal-reference/municipalities",
      countries: "/fiscal-reference/countries",
    },
    importProcess: {
      list: "/import-processes",
      dashboardSummary: "/import-processes/dashboard-summary",
      metadata: "/import-processes/metadata",
      clientGroups: "/import-processes/client-groups",
      detail: (id: string) => `/import-processes/${resourceId(id)}`,
      workflowState: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-workflow-state`,
      duimpFetch: (id: string) =>
        `/import-processes/${resourceId(id)}/duimp/fetch`,
      duimpSnapshots: (id: string) =>
        `/import-processes/${resourceId(id)}/duimp-snapshots`,
      nfeContext: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-context`,
      nfeContextResolve: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-context/resolve`,
      itemClassifications: (id: string) =>
        `/import-processes/${resourceId(id)}/item-classifications`,
      documentPlan: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-document-plan`,
      documentPlanDrafts: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-document-plan/generate-drafts`,
      documentPlanXmls: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-document-plan/generate-xmls`,
      documentPlanXmlDownload: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-document-plan/xmls/download`,
      drafts: (id: string) =>
        `/import-processes/${resourceId(id)}/nfe-drafts`,
      draft: (id: string) => `/nfe-drafts/${resourceId(id)}`,
      draftItem: (id: string, itemId: string) =>
        `/nfe-drafts/${resourceId(id)}/items/${resourceId(itemId)}`,
      draftItemTaxAdjustment: (id: string, itemId: string) =>
        `/nfe-drafts/${resourceId(id)}/items/${resourceId(itemId)}/tax-adjustment`,
      draftValidate: (id: string) =>
        `/nfe-drafts/${resourceId(id)}/validate`,
      draftXmlDownload: (id: string, versionId: string) =>
        `/nfe-drafts/${resourceId(id)}/xml-versions/${resourceId(versionId)}/download`,
      draftXmlSign: (id: string, versionId: string) =>
        `/nfe-drafts/${resourceId(id)}/xml-versions/${resourceId(versionId)}/sign`,
      draftDanfePreview: (id: string, versionId: string) =>
        `/nfe-drafts/${resourceId(id)}/xml-versions/${resourceId(versionId)}/danfe-preview`,
    },
  },
  bff: {
    health: "/api/health",
    auth: {
      login: "/api/auth/login",
      refresh: "/api/auth/refresh",
      logout: "/api/auth/logout",
    },
    organization: {
      portalUnico: "/api/organization/integrations/portal-unico",
      portalUnicoTest: "/api/organization/integrations/portal-unico/test",
    },
    importProcess: {
      list: "/api/import-processes",
      dashboardSummary: "/api/import-processes/summary",
      detail: (id: string) => `/api/import-processes/${resourceId(id)}`,
      workflowState: (id: string) =>
        `/api/import-processes/${resourceId(id)}/workflow`,
      duimpFetch: (id: string) =>
        `/api/import-processes/${resourceId(id)}/duimp`,
      duimpSnapshot: (id: string, snapshotId: string) =>
        `/api/import-processes/${resourceId(id)}/duimp/${resourceId(snapshotId)}`,
      nfeContext: (id: string) =>
        `/api/import-processes/${resourceId(id)}/context`,
      itemClassifications: (id: string) =>
        `/api/import-processes/${resourceId(id)}/classifications`,
      documentPlan: (id: string) =>
        `/api/import-processes/${resourceId(id)}/document-plan`,
      drafts: (id: string) =>
        `/api/import-processes/${resourceId(id)}/drafts`,
      draft: (id: string) => `/api/nfe-drafts/${resourceId(id)}`,
      draftItem: (id: string, itemId: string) =>
        `/api/nfe-drafts/${resourceId(id)}/items/${resourceId(itemId)}`,
      draftItemTaxAdjustment: (id: string, itemId: string) =>
        `/api/nfe-drafts/${resourceId(id)}/items/${resourceId(itemId)}/tax-adjustment`,
      draftValidate: (id: string) =>
        `/api/nfe-drafts/${resourceId(id)}/validate`,
      draftXmlDownload: (id: string, versionId: string) =>
        `/api/nfe-drafts/${resourceId(id)}/xml-versions/${resourceId(versionId)}/download`,
      draftXmlSign: (id: string, versionId: string) =>
        `/api/nfe-drafts/${resourceId(id)}/xml-versions/${resourceId(versionId)}/sign`,
      draftDanfePreview: (id: string, versionId: string) =>
        `/api/nfe-drafts/${resourceId(id)}/xml-versions/${resourceId(versionId)}/danfe-preview`,
      documentPlanXmls: (id: string) =>
        `/api/import-processes/${resourceId(id)}/xmls`,
    },
    client: {
      list: "/api/clients",
      detail: (id: string) => `/api/clients/${resourceId(id)}`,
      cnpjLookup: (cnpj: string) =>
        `/api/clients/lookup/cnpj/${resourceId(cnpj)}`,
      fiscalProfile: (id: string) =>
        `/api/clients/${resourceId(id)}/fiscal-profile`,
      fiscalCertificates: (id: string) =>
        `/api/clients/${resourceId(id)}/fiscal-certificates`,
      fiscalCertificateValidate: (id: string, certificateId: string) =>
        `/api/clients/${resourceId(id)}/fiscal-certificates/${resourceId(certificateId)}/validate`,
      fiscalCertificateActivate: (id: string, certificateId: string) =>
        `/api/clients/${resourceId(id)}/fiscal-certificates/${resourceId(certificateId)}/activate`,
      importTaxRules: (id: string) =>
        `/api/clients/${resourceId(id)}/import-tax-rules`,
      importTaxRule: (id: string, ruleId: string) =>
        `/api/clients/${resourceId(id)}/import-tax-rules/${resourceId(ruleId)}`,
      importTaxRuleDiagnostics: (id: string) =>
        `/api/clients/${resourceId(id)}/import-tax-rules/diagnostics`,
      importTaxRuleSimulation: (id: string) =>
        `/api/clients/${resourceId(id)}/import-tax-rules/simulate`,
      nfeNumberSequences: (id: string) =>
        `/api/clients/${resourceId(id)}/nfe-number-sequences`,
      issuanceReadiness: (id: string) =>
        `/api/clients/${resourceId(id)}/issuance-readiness`,
    },
    fiscalReference: {
      postalCode: (zipCode: string) =>
        `/api/fiscal-reference/postal-codes/${resourceId(zipCode)}`,
      municipalities: "/api/fiscal-reference/municipalities",
      countries: "/api/fiscal-reference/countries",
    },
  },
} as const;
