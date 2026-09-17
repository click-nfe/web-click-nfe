import type { Metadata } from "next";

import { ClientList } from "@/components/dashboard/client-list";

export const metadata: Metadata = {
  title: "Clientes",
  description: "Cadastre e mantenha os clientes da sua organização.",
};

export default function ClientsPage() {
  return <ClientList />;
}
