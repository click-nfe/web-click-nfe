import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ClientEditor } from "@/components/dashboard/client-form";

export const metadata: Metadata = {
  title: "Editar cliente",
  description: "Atualize os dados cadastrais do cliente.",
};

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
};

export default async function EditClientPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);

  return (
    <>
      <Link href="/dashboard/clientes" className="button button-ghost -ml-3 w-fit px-3">
        <ArrowLeft size={16} /> Voltar para clientes
      </Link>
      <div className="mt-5">
        <p className="eyebrow">Manutenção</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">Dados do cliente</h1>
        <p className="mt-2 text-muted-foreground">Mantenha os dados cadastrais usados nos processos da organização.</p>
      </div>
      <ClientEditor clientId={id} created={query.created === "1"} />
    </>
  );
}
