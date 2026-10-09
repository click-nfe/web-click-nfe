import type { Metadata } from "next";
import { ProcessDetails } from "@/components/dashboard/process-details";
export const metadata: Metadata = { title: "Processo | Painel" };
export default async function ProcessDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  return <ProcessDetails processId={(await params).id} />;
}
