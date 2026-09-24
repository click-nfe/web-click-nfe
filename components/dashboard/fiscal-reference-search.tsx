"use client";

import { Check, LoaderCircle, Search } from "lucide-react";
import { useDeferredValue, useId, useState } from "react";
import useSWR from "swr";

import type {
  FiscalCountry,
  FiscalMunicipality,
  FiscalReferenceList,
} from "@/lib/api/fiscal-reference";
import { routes } from "@/lib/api/routes";
import { bffFetcher } from "@/lib/bff/client";

type SearchFieldProps<T> = {
  value: string;
  label: string;
  placeholder: string;
  help: string;
  disabled?: boolean;
  selected: boolean;
  url: (query: string) => string;
  resultLabel: (item: T) => string;
  resultKey: (item: T) => string;
  onQueryChange: (value: string) => void;
  onSelect: (item: T) => void;
};

function SearchField<T>({
  value,
  label,
  placeholder,
  help,
  disabled,
  selected,
  url,
  resultLabel,
  resultKey,
  onQueryChange,
  onSelect,
}: SearchFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const deferredQuery = useDeferredValue(value.trim());
  const requestUrl = deferredQuery.length >= 2 ? url(deferredQuery) : null;
  const { data, isLoading } = useSWR<FiscalReferenceList<T>>(requestUrl, bffFetcher, {
    keepPreviousData: true,
  });

  return (
    <label className="relative block">
      <span className="field-label">{label}</span>
      <span className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          className="field-input pl-11 pr-10"
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onChange={(event) => {
            setOpen(true);
            onQueryChange(event.target.value);
          }}
        />
        {isLoading ? (
          <LoaderCircle className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" size={16} />
        ) : selected ? (
          <Check className="absolute right-4 top-1/2 -translate-y-1/2 text-primary" size={17} />
        ) : null}
      </span>
      <span className="mt-1.5 block text-xs text-muted-foreground">{help}</span>
      {open && deferredQuery.length >= 2 ? (
        <div id={listId} className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-border bg-popover p-1.5 shadow-xl" role="listbox">
          {data?.items.length ? data.items.map((item) => (
            <button
              key={resultKey(item)}
              type="button"
              className="flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm hover:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setOpen(false);
                onSelect(item);
              }}
              role="option"
              aria-selected={resultLabel(item) === value}
            >
              {resultLabel(item)}
            </button>
          )) : !isLoading ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Nenhum resultado encontrado no catálogo local.</p>
          ) : null}
        </div>
      ) : null}
    </label>
  );
}

export function MunicipalitySearch({
  value,
  selectedCode,
  disabled,
  onQueryChange,
  onSelect,
}: {
  value: string;
  selectedCode: string;
  disabled?: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (item: FiscalMunicipality) => void;
}) {
  return (
    <SearchField<FiscalMunicipality>
      value={value}
      label="Município *"
      placeholder="Digite o nome ou código IBGE"
      help={selectedCode ? `Código IBGE identificado: ${selectedCode}` : "Selecione um município da lista para preencher o código IBGE e a UF."}
      disabled={disabled}
      selected={Boolean(selectedCode)}
      url={(query) => `${routes.bff.fiscalReference.municipalities}?q=${encodeURIComponent(query)}`}
      resultLabel={(item) => `${item.name} — ${item.state}`}
      resultKey={(item) => item.code}
      onQueryChange={onQueryChange}
      onSelect={onSelect}
    />
  );
}

export function CountrySearch({
  value,
  selectedCode,
  activeOn,
  disabled,
  onQueryChange,
  onSelect,
}: {
  value: string;
  selectedCode: string;
  activeOn?: string | null;
  disabled?: boolean;
  onQueryChange: (value: string) => void;
  onSelect: (item: FiscalCountry) => void;
}) {
  return (
    <SearchField<FiscalCountry>
      value={value}
      label="País *"
      placeholder="Digite o nome, ISO ou código BACEN"
      help={selectedCode ? `Código BACEN identificado: ${selectedCode}` : "Selecione um país da lista; o código fiscal será preenchido automaticamente."}
      disabled={disabled}
      selected={Boolean(selectedCode)}
      url={(query) => {
        const search = new URLSearchParams({ q: query });
        if (activeOn) search.set("active_on", activeOn);
        return `${routes.bff.fiscalReference.countries}?${search.toString()}`;
      }}
      resultLabel={(item) => item.name}
      resultKey={(item) => item.bacen_code}
      onQueryChange={onQueryChange}
      onSelect={onSelect}
    />
  );
}
