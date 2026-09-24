import type { Metadata } from "next";

import { NfeDraftEditor } from "@/components/dashboard/nfe-draft-editor";

export const metadata: Metadata = {
  title: "Configurar rascunho da NF-e",
  description: "Revise e corrija os dados fiscais de uma NF-e filha.",
};

type Props = { params: Promise<{ id: string; draftId: string }> };

export default async function NfeDraftEditorPage({ params }: Props) {
  const { id, draftId } = await params;
  return <NfeDraftEditor processId={id} draftId={draftId} />;
}
