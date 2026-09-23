import type { Metadata } from "next";

import { NewNfeIssuance } from "@/components/dashboard/new-nfe-issuance";

export const metadata: Metadata = {
  title: "Nova emissão",
  description: "Inicie um processo de emissão de NF-e a partir da DUIMP.",
};

type Props = {
  searchParams: Promise<{ client_id?: string | string[] }>;
};

export default async function NewImportProcessPage({ searchParams }: Props) {
  const query = await searchParams;
  const clientId = Array.isArray(query.client_id) ? query.client_id[0] : query.client_id;
  return <NewNfeIssuance initialClientId={clientId} />;
}
