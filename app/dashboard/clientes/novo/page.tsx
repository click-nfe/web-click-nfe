import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { NewClientForm } from "@/components/dashboard/client-form";

export const metadata: Metadata = {
  title: "Novo cliente",
  description: "Cadastre um novo cliente na organização.",
};

export default function NewClientPage() {
  return (
    <>
      <Link href="/dashboard/clientes" className="button button-ghost -ml-3 w-fit px-3">
        <ArrowLeft size={16} /> Voltar para clientes
      </Link>
      <div className="mt-5">
        <p className="eyebrow">Cadastro</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.04em]">Novo cliente</h1>
        <p className="mt-2 text-muted-foreground">Informe os dados básicos do importador. A configuração fiscal detalhada será realizada separadamente.</p>
      </div>
      <NewClientForm />
    </>
  );
}
