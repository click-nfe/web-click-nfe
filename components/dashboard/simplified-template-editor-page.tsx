"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import useSWR from "swr";
import type { ClientRecord } from "@/lib/api/client-record";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { ClientSimplifiedIssuance } from "@/components/dashboard/client-simplified-issuance";

export function SimplifiedTemplateEditorPage({ clientId, templateId }: { clientId: string; templateId?: string }) {
  const { data, error, isLoading, mutate } = useSWR<ClientRecord>(routes.bff.client.detail(clientId), bffFetcher);
  return <>
    <Link className="button button-ghost" href={`/dashboard/clientes/${clientId}?section=simplified-issuance`}><ArrowLeft size={16} /> Voltar aos modelos</Link>
    {isLoading ? <div className="mt-8 h-52 animate-pulse rounded-xl bg-muted" /> : error ? <p className="mt-8 text-destructive">{bffErrorMessage(error)}</p> : data ?
      <ClientSimplifiedIssuance client={data} templateId={templateId} onClientUpdated={(updated) => mutate(updated, { revalidate: false })} /> : null}
  </>;
}
