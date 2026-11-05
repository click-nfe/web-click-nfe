"use client";

import { FileSpreadsheet, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import type { SimplifiedTemplateList } from "@/lib/api/simplified-issuance";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { archiveSimplifiedTemplate } from "@/lib/bff/simplified-issuance";

export function ClientSimplifiedTemplates({ clientId }: { clientId: string }) {
  const { data, error, isLoading, mutate } = useSWR<SimplifiedTemplateList>(routes.bff.client.simplifiedTemplates(clientId), bffFetcher);
  const [issue, setIssue] = useState("");
  const base = `/dashboard/clientes/${clientId}/emissoes-simplificadas`;
  async function archive(id: string, name: string) {
    if (!window.confirm(`Arquivar o modelo “${name}”? Os processos já criados manterão os dados copiados.`)) return;
    try {
      await archiveSimplifiedTemplate(clientId, id);
      await mutate({ items: (data?.items ?? []).filter((item) => item.id !== id) }, { revalidate: false });
    } catch (reason) { setIssue(bffErrorMessage(reason)); }
  }
  return <section className="surface-card mt-8 p-6 sm:p-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow">Modelos reutilizáveis</p><h2 className="mt-3 text-2xl font-semibold">Emissão simplificada</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Prepare modelos para as operações recorrentes deste cliente. Na próxima emissão, escolha um modelo e revise apenas o que mudou.</p></div>
      <Link className="button button-primary" href={`${base}/novo`}><Plus size={17} /> Cadastrar modelo</Link>
    </div>
    {issue ? <p role="alert" className="mt-5 text-sm text-destructive">{issue}</p> : null}
    {error ? <p role="alert" className="mt-5 text-sm text-destructive">{bffErrorMessage(error)}</p> : null}
    {isLoading ? <div className="mt-6 h-32 animate-pulse rounded-xl bg-muted" /> : data?.items.length ?
      <div className="mt-6 grid gap-4 md:grid-cols-2">{data.items.map((item) => <article key={item.id} className="rounded-2xl border border-border p-5">
        <FileSpreadsheet size={22} className="text-sage-strong" /><h3 className="mt-3 text-lg font-semibold">{item.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{item.description || "Modelo para preenchimento de uma nova operação."}</p>
        <p className="mt-2 text-xs text-muted-foreground">{item.item_count} produto(s) · Atualizado em {item.updated_at ? new Date(item.updated_at).toLocaleDateString("pt-BR") : "—"}</p>
        <div className="mt-5 flex gap-3"><Link className="button button-secondary" href={`${base}/${item.id}`}><Pencil size={15} /> Editar</Link>
          <button className="button button-ghost" type="button" onClick={() => void archive(item.id, item.name)}><Trash2 size={15} /> Arquivar</button></div>
      </article>)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
        <FileSpreadsheet className="mx-auto text-sage-strong" size={28} /><h3 className="mt-3 font-semibold">Nenhum modelo cadastrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">Cadastre os dados recorrentes uma vez e aproveite-os nas próximas emissões deste cliente.</p>
      </div>}
  </section>;
}
