import type { Metadata } from "next";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export const metadata: Metadata = {
  title: "Visão geral",
  description: "Acompanhe sua operação no Click NFe.",
};

export default function DashboardPage() {
  return <DashboardOverview />;
}
