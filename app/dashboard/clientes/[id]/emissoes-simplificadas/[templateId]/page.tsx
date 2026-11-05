import { SimplifiedTemplateEditorPage } from "@/components/dashboard/simplified-template-editor-page";
export default async function Page({ params }: { params: Promise<{ id: string; templateId: string }> }) {
  const { id, templateId } = await params;
  return <SimplifiedTemplateEditorPage clientId={id} templateId={templateId} />;
}
