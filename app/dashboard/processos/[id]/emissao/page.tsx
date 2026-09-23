import type { Metadata } from "next";

import { NfeIssuanceProcess } from "@/components/dashboard/nfe-issuance-process";

export const metadata: Metadata = {
  title: "Emissão de NF-e",
  description: "Prepare a NF-e de importação a partir dos dados da DUIMP.",
};

type Props = { params: Promise<{ id: string }> };

export default async function NfeIssuancePage({ params }: Props) {
  const { id } = await params;
  return <NfeIssuanceProcess processId={id} />;
}
