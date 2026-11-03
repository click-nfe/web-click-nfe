import type { SimplifiedConfig, SimplifiedItem, SimplifiedOperation } from "@/lib/api/simplified-issuance";

export function emptySimplifiedConfig(): SimplifiedConfig {
  return { series: "", document: {}, transport: {}, payment: {}, volume: {}, additional_info: {}, items: [] };
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

export async function importSimplifiedWorkbook(file: File): Promise<{ config: SimplifiedConfig; operation: SimplifiedOperation }> {
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
  const general = sheet("Configuração");
  const operationRows = sheet("Operação");
  let items: SimplifiedItem[];
  let source: Rows;
  if (modelo.length && value(modelo[0]?.[0]) === "Referência" && value(modelo[0]?.[3]) === "NCM") {
    items = modelo.slice(1).map((row) => ({
      reference: value(row[0]), product_code: value(row[1]), description: value(row[2]),
      ncm: digits(row[3]), cfop: digits(row[4]), unit: value(row[5]), import_purpose: purpose(value(row[6])),
      tax_configuration: { ii_rate: rate(row[7]), ipi_rate: rate(row[8]), pis_rate: rate(row[9]),
        cofins_rate: rate(row[10]), icms_cst: value(row[11]), icms_rate: rate(row[12]),
        icms_base_reduction_rate: rate(row[13]), icms_origin: value(row[14]), ipi_cst: value(row[15]),
        pis_cst: value(row[16]), cofins_cst: value(row[17]) },
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
  const config = emptySimplifiedConfig();
  config.items = items;
  if (carrierName) config.transport.carrier_name = carrierName;
  const sections = new Set(["document", "transport", "payment", "volume", "additional_info"]);
  if (general.length) {
    if (value(general[0]?.[0]) !== "Campo" || value(general[0]?.[1]) !== "Valor") throw new Error("Cabeçalho da aba Configuração inválido.");
    for (const row of general.slice(1)) {
      const key = value(row[0]);
      if (!key || !value(row[1])) continue;
      if (key === "series") { config.series = value(row[1]); continue; }
      const [section, field] = key.split(".");
      if (!sections.has(section) || !field || !/^[a-z_]+$/.test(field)) throw new Error(`Campo de configuração desconhecido: ${key}`);
      (config[section as "document" | "transport" | "payment" | "volume" | "additional_info"] as Record<string, string>)[field] = value(row[1]);
    }
  }
  const operation: SimplifiedOperation = { duimp_number: "", number: "", sign: false, duimp_overrides: {}, foreign_supplier: {}, additional_costs: {} };
  if (operationRows.length) {
    if (value(operationRows[0]?.[0]) !== "Campo" || value(operationRows[0]?.[1]) !== "Valor") throw new Error("Cabeçalho da aba Operação inválido.");
    for (const row of operationRows.slice(1)) {
      const key = value(row[0]); const data = value(row[1]);
      if (!data) continue;
      if (key === "duimp_number") operation.duimp_number = data;
      else if (key === "number") operation.number = data;
      else if (key === "sign") operation.sign = ["sim", "true", "1"].includes(data.toLowerCase());
      else if (key.startsWith("duimp_overrides.") && ["clearance_location", "clearance_state", "clearance_date", "transport_mode_code"].includes(key.split(".")[1])) operation.duimp_overrides[key.split(".")[1]] = data;
      else if (key.startsWith("foreign_supplier.") && ["name", "country_code", "country_name"].includes(key.split(".")[1])) operation.foreign_supplier[key.split(".")[1]] = data;
      else if (key.startsWith("additional_costs.") && ["afrmm", "siscomex_fee", "thc", "other"].includes(key.split(".")[1])) operation.additional_costs[key.split(".")[1]] = rate(data);
      else throw new Error(`Campo da operação desconhecido: ${key}`);
    }
  }
  return { config, operation };
}

export async function downloadSimplifiedWorkbook() {
  const { utils, writeFile } = await import("xlsx");
  const workbook = utils.book_new();
  const rows = [["Referência", "Código NF-e", "Descrição", "NCM", "CFOP", "Unidade", "Finalidade", "II %", "IPI %", "PIS %", "COFINS %", "ICMS CST", "ICMS %", "Redução base ICMS %", "Origem ICMS", "IPI CST", "PIS CST", "COFINS CST"],
    ["REF-001", "PROD-001", "Descrição do produto", "39172290", "3102", "UN", "Comercialização", "", "", "", "", "00", "", "", "", "", "", ""]];
  const sheet = utils.aoa_to_sheet(rows);
  sheet["!cols"] = [16, 18, 38, 14, 10, 12, 22, 10, 10, 10, 12, 12, 10].map((wch) => ({ wch }));
  utils.book_append_sheet(workbook, sheet, "Emissão simplificada");
  const config = utils.aoa_to_sheet([["Campo", "Valor", "Orientação"],
    ["series", "", "Série recorrente; o número da NF-e vai na aba Operação."],
    ["document.operation_nature", "", "Natureza da operação"], ["document.presence_indicator", "", "0, 1, 2, 3, 4, 5 ou 9"],
    ["document.intermediary_indicator", "", "0 ou 1"], ["transport.freight_mode", "", "0, 1, 2, 3, 4 ou 9"],
    ...["carrier_name", "carrier_tax_id", "carrier_state_registration", "carrier_address", "carrier_city", "carrier_state"].map((key) => [`transport.${key}`, "", "Dados da transportadora, se aplicáveis"]),
    ...["quantity", "species", "brand", "numbering", "net_weight", "gross_weight"].map((key) => [`volume.${key}`, "", "Volume padrão; revise a cada operação"]),
    ...["payment_indicator", "method", "description", "value"].map((key) => [`payment.${key}`, "", "Pagamento padrão; revise a cada operação"]),
    ...["fiscal", "complementary", "legal_text"].map((key) => [`additional_info.${key}`, "", "Informação recorrente; sem dados de uma DUIMP específica"])]);
  config["!cols"] = [{ wch: 38 }, { wch: 40 }, { wch: 62 }];
  utils.book_append_sheet(workbook, config, "Configuração");
  const operation = utils.aoa_to_sheet([["Campo", "Valor", "Orientação"], ["duimp_number", "", "DUIMP desta operação"], ["number", "", "Opcional; sem número, usa a sequência da NF-e configurada"], ["sign", "Não", "Sim exige XSD válido, revisão fiscal e certificado ativo; nunca transmite à SEFAZ"],
    ...["clearance_location", "clearance_state", "clearance_date", "transport_mode_code"].map((key) => [`duimp_overrides.${key}`, "", "Preencher somente se ausente na consulta da DUIMP; conferir fonte aduaneira"]),
    ...["name", "country_code", "country_name"].map((key) => [`foreign_supplier.${key}`, "", "Fornecedor estrangeiro desta operação; código BACEN com 4 dígitos"]),
    ...["afrmm", "siscomex_fee", "thc", "other"].map((key) => [`additional_costs.${key}`, "", "Valor desta operação em reais; evite repetir custo já presente na DUIMP"])]);
  operation["!cols"] = [{ wch: 28 }, { wch: 30 }, { wch: 80 }];
  utils.book_append_sheet(workbook, operation, "Operação");
  writeFile(workbook, "modelo-emissao-simplificada.xlsx");
}
