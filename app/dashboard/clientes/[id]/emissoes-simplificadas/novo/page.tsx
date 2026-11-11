import { SimplifiedTemplateEditorPage } from "@/components/dashboard/simplified-template-editor-page";
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <SimplifiedTemplateEditorPage clientId={(await params).id} />;
}
