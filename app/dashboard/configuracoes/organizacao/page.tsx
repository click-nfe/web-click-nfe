import type { Metadata } from "next";
import { OrganizationProfile } from "@/components/dashboard/organization-profile";
export const metadata: Metadata = { title: "Organização | Configurações" };
export default function OrganizationPage() { return <OrganizationProfile />; }
