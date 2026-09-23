import type { Metadata } from "next";

import { OrganizationSettings } from "@/components/dashboard/organization-settings";

export const metadata: Metadata = {
  title: "Configurações",
  description: "Configure as integrações da sua organização.",
};

export default function SettingsPage() {
  return <OrganizationSettings />;
}
