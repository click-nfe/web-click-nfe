"use client";

import { useState } from "react";
import useSWR from "swr";
import { LoaderCircle, Save } from "lucide-react";

import type { Reconciliation } from "@/lib/api/simplified-issuance";
import { routes } from "@/lib/api/routes";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { saveSimplifiedLinks } from "@/lib/bff/simplified-issuance";

export function SimplifiedReconciliation({ processId, onUpdated }: { processId: string; onUpdated: () => void }) {
  const { data, error, mutate } = useSWR<Reconciliation>(routes.bff.importProcess.simplifiedReconciliation(processId), bffFetcher);
  const [chosen, setChosen] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [issue, setIssue] = useState("");
  const [notice, setNotice] = useState("");
  if (error) return <section className="surface-card mt-6 p-6 text-sm text-destructive">{bffErrorMessage(error)}</section>;
  if (!data) return <section className="surface-card mt-6 h-24 animate-pulse" aria-label="Comparando produtos" />;
  const pending = data.items.filter((item) => item.status === "ambiguous" || item.status === "unmatched");

  async function save() {
    setSaving(true); setIssue(""); setNotice("");
    try {
      const links = Object.fromEntries(data!.items.filter((item) => chosen[item.duimp_item_number] !== undefined).map((item) => [item.duimp_item_number, chosen[item.duimp_item_number]]));
      const next = await saveSimplifiedLinks(processId, links);
      await mutate(next, { revalidate: false });
      setChosen({});
      setNotice("Associações salvas. Revise a classificação fiscal antes de gerar o rascunho.");
      onUpdated();
    } catch (reason) { setIssue(bffErrorMessage(reason)); }
    finally { setSaving(false); }
  }

  return <section className="surface-card mt-6 scroll-mt-40 p-6 sm:p-8" id="nfe-simplified-reconciliation">
    <p className="eyebrow">Emissão simplificada</p><h2 className="mt-2 text-xl font-semibold">Comparar produtos com a DUIMP</h2>
    <p className="mt-2 text-sm text-muted-foreground">Código do catálogo e NCM iguais permitem associação automática. Itens sem correspondência ficam para revisão. As regras fiscais do cadastro não são substituídas pela consulta.</p>
    <p className="mt-4 text-sm font-medium">{data.items.length - pending.length} associados automaticamente · {pending.length} para revisar</p>
    {pending.length ? <div className="mt-5 space-y-3">{pending.map((item) => {
      const choices = data.templates.map((template, index) => ({ template, index })).filter(({ template }) => template.ncm === item.ncm);
      return <div key={item.duimp_item_number} className="grid gap-3 rounded-xl border border-border p-4 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div><p className="font-semibold">Item DUIMP {item.duimp_item_number} · {item.catalog_product_code || "sem código de catálogo"}</p>
          <p className="mt-1 text-xs text-muted-foreground">NCM {item.ncm} · {item.description}</p></div>
        <label><span className="field-label">Associar ao produto cadastrado</span><select className="field-input" value={chosen[item.duimp_item_number] ?? ""} onChange={(event) => setChosen((current) => { const next = { ...current }; if (event.target.value) next[item.duimp_item_number] = Number(event.target.value); else delete next[item.duimp_item_number]; return next; })}>
          <option value="">Manter sem associação</option>{choices.map(({ template, index }) => <option key={index} value={index}>{template.product_code || template.reference || template.description} · NCM {template.ncm}</option>)}
        </select>{!choices.length ? <span className="mt-1 block text-xs text-amber-700">Nenhum produto cadastrado com este NCM. Ajuste manualmente a classificação no processo.</span> : null}</label>
      </div>;
    })}</div> : <p className="mt-4 rounded-xl bg-sage-soft p-4 text-sm text-sage-strong">Todos os itens encontraram uma referência única. Confira os dados fiscais na próxima etapa.</p>}
    {issue ? <p className="mt-4 text-sm text-destructive" role="alert">{issue}</p> : null}
    {notice ? <p className="mt-4 text-sm text-sage-strong" role="status">{notice}</p> : null}
    {Object.keys(chosen).length ? <button type="button" className="button button-primary mt-5" disabled={saving} onClick={save}>
      {saving ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{saving ? "Salvando..." : "Salvar associações"}
    </button> : null}
  </section>;
}
