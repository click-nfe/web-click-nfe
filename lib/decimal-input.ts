/** Parse numbers typed in Brazilian or API notation without losing cents. */
export function decimalInput(value: string, label: string, optional = false): string | null {
  const raw = value.normalize("NFC").trim().replace(/^R\$\s*/, "").replace(/[\s\u00a0]/g, "");
  if (!raw && optional) return null;
  let canonical: string;
  if (/^\d{1,3}(?:\.\d{3})+[,]\d+$/.test(raw)) {
    canonical = raw.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(?:,\d{3})+\.\d+$/.test(raw)) {
    canonical = raw.replace(/,/g, "");
  } else if (/^\d{1,3}(?:\.\d{3}){2,}$/.test(raw)) {
    canonical = raw.replace(/\./g, "");
  } else if (/^\d{1,3}(?:,\d{3}){2,}$/.test(raw)) {
    canonical = raw.replace(/,/g, "");
  } else {
    canonical = raw.replace(",", ".");
  }
  if (!/^\d+(?:\.\d+)?$/.test(canonical) || !Number.isFinite(Number(canonical))) {
    throw new Error(`${label}: informe um número válido, por exemplo 1.500,00 ou 1500.00.`);
  }
  return canonical;
}

export function integerInput(value: string, label: string): number | null {
  if (!value.trim()) return null;
  const raw = value.trim().replace(/[\s\u00a0]/g, "");
  const canonical = /^\d{1,3}(?:[.,]\d{3})+$/.test(raw)
    ? raw.replace(/[.,]/g, "") : decimalInput(value, label);
  const number = Number(canonical);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`${label}: informe um número inteiro válido.`);
  }
  return number;
}
