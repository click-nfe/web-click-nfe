import type { Metadata } from "next";
import { OrganizationSettings } from "@/components/dashboard/organization-settings";
export const metadata: Metadata = { title: "Portal Único | Configurações" };
export default function PortalUnicoPage() { return <OrganizationSettings />; }
