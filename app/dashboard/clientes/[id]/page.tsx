import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import {
  ClientProfile,
  isClientProfileSection,
} from "@/components/dashboard/client-profile";

export const metadata: Metadata = {
  title: "Perfil do cliente",
  description: "Consulte e configure os dados fiscais e operacionais do cliente.",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; section?: string }>;
};

export default async function ClientProfilePage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const section = isClientProfileSection(query.section)
    ? query.section
    : "overview";

  return (
    <>
      <Link href="/dashboard/clientes" className="button button-ghost -ml-3 w-fit px-3">
        <ArrowLeft size={16} /> Voltar para clientes
      </Link>
      <ClientProfile
        clientId={id}
        section={section}
        created={query.created === "1"}
      />
    </>
  );
}
