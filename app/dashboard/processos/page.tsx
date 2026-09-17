import type { Metadata } from "next";

import { ImportProcessList } from "@/components/dashboard/import-process-list";

export const metadata: Metadata = {
  title: "Processos",
  description: "Consulte os processos de importação da sua organização.",
};

export default function ImportProcessesPage() {
  return <ImportProcessList />;
}
