import type { SimplifiedConfig, SimplifiedItem } from "@/lib/api/simplified-issuance";

export function emptySimplifiedConfig(): SimplifiedConfig {
  return { document: {}, transport: {}, additional_info: {}, items: [] };
}

type Cell = string | number | null | undefined;
type Rows = Cell[][];
const value = (cell: Cell) => String(cell ?? "").trim();
const digits = (cell: Cell) => value(cell).replace(/\D/g, "");
const rate = (cell: Cell) => value(cell).replace(",", ".");

function purpose(valueText: string) {
  const normalized = valueText.toLocaleLowerCase("pt-BR");
  if (normalized.includes("industrial")) return "industrialization";
  if (normalized.includes("revenda") || normalized.includes("comercial")) return "resale";
  if (normalized.includes("ativo")) return "fixed_asset";
  if (normalized.includes("consumo") || normalized.includes("uso")) return "use_consumption";
  return "";
}

function itemFromDetails(row: Cell[]): SimplifiedItem | null {
  const ncm = digits(row[3]);
  const description = value(row[5]);
  if (ncm.length !== 8 || !description || description === "0") return null;
  const reference = value(row[4]);
  return {
    reference: reference === "0" ? "" : reference,
    product_code: reference === "0" || reference.length > 60 ? "" : reference,
    description, ncm, cfop: "", unit: "", import_purpose: purpose(value(row[25])),
    tax_configuration: { ii_rate: rate(row[13]), ipi_rate: rate(row[15]), pis_rate: rate(row[18]), cofins_rate: rate(row[20]), icms_rate: rate(row[28]) },
  };
}

function itemFromBase(row: Cell[]): SimplifiedItem | null {
  const ncm = digits(row[37]);
  const description = value(row[36]);
  if (ncm.length !== 8 || !description || description === "0") return null;
  const reference = value(row[35]);
  return {
    reference, product_code: reference.length <= 60 ? reference : "",
    description, ncm, cfop: digits(row[39]), unit: value(row[49]).length <= 6 ? value(row[49]) : "",
    import_purpose: purpose(value(row[41]) || value(row[42])),
    tax_configuration: { ii_rate: rate(row[56]), icms_rate: rate(row[59]), ipi_rate: rate(row[65]), pis_rate: rate(row[68]), cofins_rate: rate(row[71]) },
  };
}

export async function importSimplifiedWorkbook(file: File): Promise<SimplifiedConfig> {
  if (!/\.(xls|xlsx)$/i.test(file.name)) throw new Error("Escolha uma planilha .xls ou .xlsx.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A planilha deve ter até 5 MB.");
  const { read, utils } = await import("xlsx");
  const workbook = read(await file.arrayBuffer(), { type: "array", cellDates: false });
  const sheet = (name: string): Rows => workbook.Sheets[name]
    ? utils.sheet_to_json<Rows[number]>(workbook.Sheets[name], { header: 1, raw: false, defval: "" })
    : [];
  const details = sheet("Detalhes");
  const base = sheet("Base");
  const acompanhamento = sheet("acompanhamento");
  const modelo = sheet("Emissão simplificada");
  let items: SimplifiedItem[];
  let source: Rows;
  if (modelo.length && value(modelo[0]?.[0]) === "Referência" && value(modelo[0]?.[3]) === "NCM") {
    items = modelo.slice(1).map((row) => ({
      reference: value(row[0]), product_code: value(row[1]), description: value(row[2]),
      ncm: digits(row[3]), cfop: digits(row[4]), unit: value(row[5]), import_purpose: purpose(value(row[6])),
      tax_configuration: { ii_rate: rate(row[7]), ipi_rate: rate(row[8]), pis_rate: rate(row[9]),
        cofins_rate: rate(row[10]), icms_cst: value(row[11]), icms_rate: rate(row[12]) },
    })).filter((item) => item.ncm.length === 8 && Boolean(item.description || item.product_code || item.reference));
    source = [];
  } else if (details.length && value(details[5]?.[3]).toUpperCase() === "NCM") {
    items = details.slice(6).map(itemFromDetails).filter((item): item is SimplifiedItem => Boolean(item));
    source = base;
  } else if (acompanhamento.length && value(acompanhamento[10]?.[37]).toUpperCase() === "NCM") {
    items = acompanhamento.slice(12).map(itemFromBase).filter((item): item is SimplifiedItem => Boolean(item));
    source = acompanhamento;
  } else if (base.length && value(base[10]?.[37]).toUpperCase() === "NCM") {
    items = base.slice(12).map(itemFromBase).filter((item): item is SimplifiedItem => Boolean(item));
    source = base;
  } else {
    throw new Error("Formato não reconhecido. Use a aba Detalhes/Base ou acompanhamento das planilhas de referência.");
  }
  if (!items.length) throw new Error("Nenhum produto válido com NCM e descrição foi encontrado.");
  if (items.length > 500) throw new Error("A configuração aceita até 500 produtos.");
  const carrierName = value(source[9]?.[2]);
  return {
    document: {}, additional_info: {}, items,
    transport: carrierName ? { carrier_name: carrierName } : {},
  };
}

export async function downloadSimplifiedWorkbook() {
  const { utils, writeFile } = await import("xlsx");
  const workbook = utils.book_new();
  const rows = [["Referência", "Código NF-e", "Descrição", "NCM", "CFOP", "Unidade", "Finalidade", "II %", "IPI %", "PIS %", "COFINS %", "ICMS CST", "ICMS %"],
    ["REF-001", "PROD-001", "Descrição do produto", "39172290", "3101", "UN", "Industrialização", "10.8", "", "", "", "00", "12"]];
  const sheet = utils.aoa_to_sheet(rows);
  sheet["!cols"] = [16, 18, 38, 14, 10, 12, 22, 10, 10, 10, 12, 12, 10].map((wch) => ({ wch }));
  utils.book_append_sheet(workbook, sheet, "Emissão simplificada");
  writeFile(workbook, "modelo-emissao-simplificada.xlsx");
}
