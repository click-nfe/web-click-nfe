"use client";

import {
  AlertTriangle,
  Boxes,
  Building2,
  ChevronDown,
  CircleDollarSign,
  LoaderCircle,
  MapPinned,
  RefreshCw,
  Ship,
} from "lucide-react";
import { useState } from "react";
import useSWR from "swr";

import type { DuimpSnapshotDetails } from "@/lib/api/import-process";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { duimpSnapshotUrl } from "@/lib/bff/import-process";

type JsonObject = Record<string, unknown>;

const transportLabels: Record<string, string> = {
  "1": "Marítima",
  "2": "Fluvial",
  "3": "Lacustre",
  "4": "Aérea",
  "5": "Postal",
  "6": "Ferroviária",
  "7": "Rodoviária",
  "8": "Conduto / rede de transmissão",
  "9": "Meios próprios",
  "10": "Entrada / saída ficta",
  "11": "Courier",
  "12": "Em mãos",
  "13": "Por reboque",
};

const modalityLabels: Record<string, string> = {
  direct: "Importação própria",
  on_behalf: "Por conta e ordem",
  by_order: "Por encomenda",
};

function object(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonObject
    : {};
}

function objects(value: unknown): JsonObject[] {
  return Array.isArray(value) ? value.filter((item): item is JsonObject => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function display(value: unknown, fallback = "Não informado") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
}

function first(source: JsonObject, ...keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined && value !== "") return value;
  }
  return null;
}

function formatDate(value: unknown) {
  const text = display(value, "");
  if (!text) return "Não informada";
  const date = new Date(`${text.slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? text : new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount)
    : display(value);
}

function taxValue(value: unknown) {
  const record = object(value);
  return first(record, "value", "due", "paid", "amount") ?? value;
}

export function DuimpCaptureDetails({
  processId,
  snapshotId,
}: {
  processId: string;
  snapshotId: string;
}) {
  const [open, setOpen] = useState(false);
  const request = useSWR<DuimpSnapshotDetails>(
    open ? duimpSnapshotUrl(processId, snapshotId) : null,
    bffFetcher,
  );

  return (
    <details
      className="group mt-5 overflow-hidden rounded-2xl border border-primary/20 bg-background/55 text-foreground"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm font-semibold marker:content-none">
        <span className="flex items-center gap-2"><Boxes size={17} /> Ver dados recebidos do Portal Único</span>
        <ChevronDown className="shrink-0 transition-transform group-open:rotate-180" size={18} aria-hidden="true" />
      </summary>

      <div className="border-t border-primary/15 p-4 sm:p-5">
        {request.error ? (
          <div className="py-5 text-center">
            <AlertTriangle className="mx-auto text-destructive" size={24} />
            <p className="mt-3 text-sm text-destructive">{bffErrorMessage(request.error)}</p>
            <button type="button" className="button button-secondary mt-4" onClick={() => request.mutate()}>
              <RefreshCw size={15} /> Tentar novamente
            </button>
          </div>
        ) : request.isLoading || !request.data ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <LoaderCircle className="animate-spin" size={18} /> Carregando detalhes da DUIMP...
          </div>
        ) : (
          <DuimpCategories snapshot={request.data} />
        )}
      </div>
    </details>
  );
}

function DuimpCategories({ snapshot }: { snapshot: DuimpSnapshotDetails }) {
  const normalized = object(snapshot.normalized);
  const importer = object(first(normalized, "importer", "importador"));
  const supplierRows = objects(normalized.foreign_suppliers);
  const suppliers = supplierRows.length ? supplierRows : [object(normalized.foreign_supplier)].filter((row) => Object.keys(row).length);
  const items = objects(normalized.items);
  const taxTotals = object(normalized.tax_totals);
  const origin = object(first(normalized, "origin_country", "country_of_origin", "pais_procedencia"));
  const transportCode = display(normalized.transport_mode_code, "");
  const modality = display(normalized.import_modality, "");
  const catalog = object(normalized.catalog_enrichment);

  return (
    <div className="space-y-4">
      <Category title="Identificação" icon={<Building2 size={18} />}>
        <InfoGrid fields={[
          ["Número", normalized.number ?? snapshot.duimp_number],
          ["Versão", normalized.version ?? snapshot.duimp_version],
          ["Registro", formatDate(normalized.registration_date)],
          ["Modalidade", modalityLabels[modality] ?? display(modality)],
          ["Importador", first(importer, "name", "legal_name", "ni", "tax_id")],
          ["CNPJ / identificação", first(importer, "tax_id", "ni", "cnpj")],
        ]} />
      </Category>

      <Category title="Carga e desembaraço" icon={<MapPinned size={18} />}>
        <InfoGrid fields={[
          ["Local", normalized.clearance_location],
          ["Código da unidade", normalized.clearance_location_code],
          ["UF", normalized.clearance_state],
          ["Data", formatDate(normalized.clearance_date)],
          ["Via de transporte", transportLabels[transportCode] ?? display(transportCode)],
          ["País de procedência", first(origin, "name", "description", "descricao", "code") ?? normalized.origin_country_name ?? normalized.origin_country],
          ["Peso líquido", first(normalized, "net_weight", "total_net_weight")],
          ["Peso bruto", first(normalized, "gross_weight", "total_gross_weight")],
        ]} />
      </Category>

      <Category title={`Exportadores (${suppliers.length})`} icon={<Ship size={18} />}>
        {suppliers.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {suppliers.map((supplier, index) => {
              const country = object(supplier.country);
              return (
                <div key={`${display(first(supplier, "code", "codigo"), String(index))}-${index}`} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-semibold">{display(first(supplier, "name", "legal_name", "razaoSocial"))}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Código {display(first(supplier, "code", "codigo"))} · Identificação {display(first(supplier, "foreign_tax_id", "foreign_id", "tin"))}
                  </p>
                  <p className="mt-2 text-sm">{display(first(supplier, "country_name", "country_iso_alpha_2") ?? first(country, "description", "descricao", "code", "codigo"))}</p>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-muted-foreground">O Portal Único não retornou um exportador identificado.</p>}
      </Category>

      <Category title={`Itens (${items.length})`} icon={<Boxes size={18} />}>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="pb-3">Item</th><th className="pb-3">Produto</th><th className="pb-3">NCM</th><th className="pb-3">Quantidade</th><th className="pb-3">Exportador</th><th className="pb-3 text-right">Valor aduaneiro</th></tr></thead>
              <tbody className="divide-y divide-border">
                {items.map((item, index) => (
                  <tr key={`${display(first(item, "number", "item_number"), String(index))}-${index}`}>
                    <td className="py-3 font-semibold">{display(first(item, "number", "item_number", "numeroItem"))}</td>
                    <td className="max-w-sm py-3 pr-4"><p className="font-medium">{display(first(item, "description", "product_description"))}</p><p className="mt-1 text-xs text-muted-foreground">{display(first(item, "product_code", "catalog_product_code"))}</p></td>
                    <td className="py-3 font-mono text-xs">{display(item.ncm)}</td>
                    <td className="py-3">{display(first(item, "quantity", "commercial_quantity"))} {display(first(item, "commercial_unit", "unit"), "")}</td>
                    <td className="py-3">{display(first(item, "exporter_code", "exporter_name"))}</td>
                    <td className="py-3 text-right font-medium">{formatMoney(first(item, "customs_value", "product_value"))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">Nenhum item foi encontrado no snapshot normalizado.</p>}
      </Category>

      <Category title="Tributos e despesas informados" icon={<CircleDollarSign size={18} />}>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(taxTotals).map(([name, value]) => (
            <Info key={name} label={name.replaceAll("_", " ").toUpperCase()} value={formatMoney(taxValue(value))} />
          ))}
          <Info label="AFRMM" value={formatMoney(normalized.afrmm_value)} />
          <Info label="Taxa Siscomex" value={formatMoney(first(normalized, "siscomex_fee", "siscomex_fee_value"))} />
        </dl>
      </Category>

      {Object.keys(catalog).length ? (
        <Category title="Enriquecimento do catálogo" icon={<RefreshCw size={18} />}>
          <InfoGrid fields={[
            ["Produtos consultados", catalog.products_requested],
            ["Produtos enriquecidos", catalog.products_enriched],
            ["Operadores consultados", catalog.operators_requested],
            ["Operadores enriquecidos", catalog.operators_enriched],
          ]} />
        </Category>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Fonte: Portal Único · Capturado em {snapshot.fetched_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(snapshot.fetched_at)) : "data não informada"}.
      </p>
    </div>
  );
}

function Category({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-background p-4 sm:p-5">
      <h3 className="flex items-center gap-2 font-semibold text-foreground">{icon}{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoGrid({ fields }: { fields: Array<[string, unknown]> }) {
  return <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{fields.map(([label, value]) => <Info key={label} label={label} value={display(value)} />)}</dl>;
}

function Info({ label, value }: { label: string; value: unknown }) {
  return <div className="rounded-xl bg-muted/45 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{display(value)}</dd></div>;
}
