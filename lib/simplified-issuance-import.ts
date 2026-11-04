import type { SimplifiedConfig, SimplifiedItem, SimplifiedOperation } from "@/lib/api/simplified-issuance";
import { fieldDefinitions } from "@/lib/simplified-issuance-fields";

export function emptySimplifiedConfig(): SimplifiedConfig {
  return { series: "", document: {}, transport: {}, payment: {}, volume: {}, additional_info: {}, items: [] };
}

type Cell = string | number | null | undefined;
type Rows = Cell[][];
const value = (cell: Cell) => String(cell ?? "").trim();
const digits = (cell: Cell) => value(cell).replace(/\D/g, "");
const rate = (cell: Cell) => value(cell).replace(",", ".");
export type ImportedSimplifiedWorkbook = { config: SimplifiedConfig; operation: SimplifiedOperation; client: Record<string, string>; fiscalProfile: Record<string, string> };
const productKeys = ["reference", "product_code", "description", "ncm", "cfop", "unit", "import_purpose", "ii_rate", "ipi_rate", "pis_rate", "cofins_rate", "ipi_cst", "pis_cst", "cofins_cst"];
const icmsKeys = ["reference", "ncm", "icms_origin", "icms_cst", "icms_rate", "icms_base_reduction_rate", "icms_deferment_rate", "icms_st_base_method", "icms_st_mva_rate", "icms_st_base_reduction_rate", "icms_st_rate", "icms_st_retained_base", "icms_st_retained_rate", "icms_st_retained_value", "icms_tax_treatment_confirmed"];
const productLabels = ["Referência no catálogo", "Código na NF-e", "Descrição do produto", "NCM", "CFOP", "Unidade", "Finalidade", "II %", "IPI %", "PIS %", "COFINS %", "IPI CST", "PIS CST", "COFINS CST"];
const icmsLabels = ["Referência no catálogo", "NCM", "Origem", "CST", "Alíquota %", "Redução base %", "Diferimento %", "Modalidade base ST", "MVA ST %", "Redução base ST %", "Alíquota ST %", "Base ST retida", "Alíquota ST retida %", "Valor ST retido", "Tratamento confirmado?"];
const productHelp = ["Código da coluna Código do Produto da DUIMP, usado para vincular à captura.", "Opcional: em branco, o cProd inicia com o código da DUIMP. Preencha para usar um código confirmado pelo emitente.", "Descrição do produto no XML; revise o cadastro.", "Oito dígitos, sem pontuação.", "Quatro dígitos da operação de importação.", "Unidade comercial de até seis caracteres.", "Revenda, industrialização, ativo ou uso e consumo.", "Alíquota de II em porcentagem.", "Alíquota de IPI em porcentagem.", "Alíquota de PIS em porcentagem.", "Alíquota de COFINS em porcentagem.", "CST do IPI de dois dígitos.", "CST do PIS de dois dígitos.", "CST da COFINS de dois dígitos."];
const icmsHelp = ["Mesma referência da aba Produtos.", "Mesmo NCM da aba Produtos.", "Origem da mercadoria, um dígito.", "CST de dois dígitos; confirme com responsável fiscal.", "Alíquota nominal do ICMS em porcentagem.", "Redução da base de cálculo em porcentagem.", "Percentual de diferimento quando aplicável.", "Modalidade 4 ou 6, se houver substituição tributária.", "Margem de valor agregado da ST em porcentagem.", "Redução da base de ST em porcentagem.", "Alíquota da ST em porcentagem.", "Base do ICMS ST retido em reais, se aplicável.", "Alíquota do ICMS ST retido em porcentagem.", "Valor do ICMS ST retido em reais, se aplicável.", "Sim somente após revisão fiscal por administrador; em branco ou Não mantém pendente."];

function structuredRows(rows: Rows, tab: string) {
  if (value(rows[0]?.[0]) !== "Nome do campo" || value(rows[0]?.[1]) !== "Descrição" || value(rows[0]?.[2]) !== "Valor" || value(rows[0]?.[3]) !== "Chave interna — não alterar") throw new Error(`Cabeçalho da aba ${tab} inválido.`);
  const result: Record<string, string> = {};
  const definitions = fieldDefinitions[tab];
  for (let index = 0; index < definitions.length; index++) {
    const row = rows[index + 1] || [];
    if (value(row[3]) !== definitions[index].key) throw new Error(`Chave interna alterada na aba ${tab}, linha ${index + 2}. Baixe um novo modelo.`);
    if (value(row[2])) result[definitions[index].key] = value(row[2]);
  }
  if (rows.slice(definitions.length + 1).some(row => row.some(cell => value(cell)))) throw new Error(`Linhas adicionais na aba ${tab} não são aceitas.`);
  return result;
}

function tabularRows(rows: Rows, tab: string, keys: string[]) {
  if (keys.some((key, index) => value(rows[2]?.[index]) !== key)) throw new Error(`Chaves internas da aba ${tab} foram alteradas. Baixe um novo modelo.`);
  return rows.slice(3).filter(row => row.some(cell => value(cell))).map((row, index) => {
    if (row.length > keys.length && row.slice(keys.length).some(cell => value(cell))) throw new Error(`Coluna inesperada na aba ${tab}, linha ${index + 4}.`);
    return Object.fromEntries(keys.map((key, col) => [key, value(row[col])]));
  });
}

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

export async function importSimplifiedWorkbook(file: File): Promise<ImportedSimplifiedWorkbook> {
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
  if (workbook.Sheets["Leia-me"]) {
    const client = structuredRows(sheet("Cliente"), "Cliente");
    const fiscalProfile = structuredRows(sheet("Perfil fiscal"), "Perfil fiscal");
    const note = structuredRows(sheet("Nota fiscal"), "Nota fiscal");
    const transport = structuredRows(sheet("Transporte"), "Transporte");
    const operationValues = structuredRows(operationRows, "Operação");
    const items = tabularRows(sheet("Produtos"), "Produtos", productKeys).map(row => ({
      reference: row.reference, product_code: row.product_code, description: row.description,
      ncm: digits(row.ncm), cfop: digits(row.cfop), unit: row.unit, import_purpose: purpose(row.import_purpose),
      tax_configuration: Object.fromEntries(productKeys.slice(7).filter(key => row[key]).map(key => [key, rate(row[key])])),
    }));
    if (!items.length || items.length > 500 || items.some(item => item.ncm.length !== 8 || !item.reference)) throw new Error("Informe de 1 a 500 produtos com referência e NCM de oito dígitos.");
    const byReference = new Map<string, SimplifiedItem>();
    for (const item of items) {
      const key = `${item.reference.trim().toLowerCase()}|${item.ncm}`;
      if (byReference.has(key)) throw new Error(`Referência repetida em Produtos: ${item.reference} / ${item.ncm}.`);
      byReference.set(key, item);
    }
    const icmsRows = tabularRows(sheet("ICMS"), "ICMS", icmsKeys);
    if (icmsRows.length !== items.length) throw new Error("A aba ICMS deve ter exatamente uma linha para cada produto.");
    const used = new Set<string>();
    for (const row of icmsRows) {
      const key = `${row.reference.trim().toLowerCase()}|${digits(row.ncm)}`;
      const item = byReference.get(key);
      if (!item || used.has(key)) throw new Error(`Referência/NCM da aba ICMS sem correspondência única: ${row.reference}.`);
      used.add(key);
      for (const field of icmsKeys.slice(2)) {
        if (!row[field]) continue;
        if (field === "icms_tax_treatment_confirmed") {
          if (!["sim", "não", "nao"].includes(row[field].toLowerCase())) throw new Error(`Use Sim ou Não para confirmação fiscal de ${row.reference}.`);
          item.tax_configuration[field] = row[field].toLowerCase() === "sim";
        } else item.tax_configuration[field] = ["icms_origin", "icms_cst", "icms_st_base_method"].includes(field) ? row[field] : rate(row[field]);
      }
    }
    const config = emptySimplifiedConfig(); config.items = items;
    for (const [key, data] of Object.entries({ ...note, ...transport })) {
      if (key === "series") { config.series = data; continue; }
      const [part, field] = key.split(".");
      if (!part || !field || !["document", "transport", "volume", "payment", "additional_info"].includes(part)) throw new Error(`Campo não reconhecido: ${key}.`);
      (config[part as "document" | "transport" | "volume" | "payment" | "additional_info"] as Record<string, string>)[field] = data;
    }
    const operation: SimplifiedOperation = { duimp_number: operationValues.duimp_number || "", number: operationValues.number || "", sign: operationValues.sign?.toLowerCase() === "sim", duimp_overrides: {}, foreign_supplier: {}, additional_costs: {} };
    if (operationValues.sign && !["sim", "não", "nao"].includes(operationValues.sign.toLowerCase())) throw new Error("Use Sim ou Não em Assinar XML.");
    for (const [key, data] of Object.entries(operationValues)) {
      const [part, field] = key.split(".");
      if (["duimp_overrides", "foreign_supplier", "additional_costs"].includes(part) && field) operation[part as "duimp_overrides" | "foreign_supplier" | "additional_costs"][field] = part === "additional_costs" ? rate(data) : data;
    }
    return { config, operation, client, fiscalProfile };
  }
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
      else if (key.startsWith("additional_costs.") && ["afrmm", "tum", "siscomex_fee", "thc", "other"].includes(key.split(".")[1])) operation.additional_costs[key.split(".")[1]] = rate(data);
      else throw new Error(`Campo da operação desconhecido: ${key}`);
    }
  }
  return { config, operation, client: {}, fiscalProfile: {} };
}

export async function downloadSimplifiedWorkbook() {
  const { utils, writeFile } = await import("xlsx");
  const workbook = utils.book_new();
  const guide = utils.aoa_to_sheet([
    ["EMISSÃO SIMPLIFICADA · COMO PREENCHER", ""],
    ["Etapa", "O que fazer"],
    ["1. Cliente e perfil fiscal", "Confira o CNPJ do cliente já cadastrado. O perfil fiscal deve conter os dados completos do emitente. Campos vazios não apagam dados existentes."],
    ["2. Nota fiscal e transporte", "Preencha apenas padrões recorrentes. Volumes e pagamentos variáveis devem ser revisados em cada operação."],
    ["3. Produtos e ICMS", "Uma linha por produto em cada aba. Use a mesma Referência e NCM nas duas. Complete CFOP, finalidade, origem, CST e alíquota; confira reduções e outras regras com o responsável fiscal."],
    ["4. Operação", "Informe a DUIMP. Número da NF-e e assinatura são opcionais. Não copie valores do rascunho sem conferir se já vieram da DUIMP."],
    ["5. Upload", "Na aba Emissão simplificada do cliente, importe o arquivo, revise os campos preenchidos e salve. Depois use Preparar XML e resolva as pendências apontadas."],
    ["Estrutura", "Nas abas de campos, edite somente Valor. A chave técnica fica na coluna final oculta. Em Produtos e ICMS, a terceira linha de chaves fica oculta. Não altere nem exclua as chaves; o upload confere sua integridade."],
    ["Resultado", "O XML só é gerado após conferir os dados exigidos. Assinatura requer certificado ativo e confirmação fiscal; este fluxo não transmite à SEFAZ."],
    ["Abas", "Cliente: cadastro; Perfil fiscal: emitente; Nota fiscal: padrões da NF-e; Transporte: frete/volumes; Produtos: mercadorias e tributos federais; ICMS: valores por referência/NCM nesta configuração; Operação: dados variáveis."],
    ["ICMS", "A aba ICMS preenche os valores dos itens desta emissão simplificada. Ela não altera as regras tributárias globais do cliente. CST, redução, diferimento e ST exigem conferência fiscal antes de assinar."],
  ]);
  guide["!cols"] = [{ wch: 30 }, { wch: 125 }];
  utils.book_append_sheet(workbook, guide, "Leia-me");
  for (const [tab, definitions] of Object.entries(fieldDefinitions)) {
    const rows = [["Nome do campo", "Descrição", "Valor", "Chave interna — não alterar"], ...definitions.map(({ label, description, key }) => [label, description, key === "sign" ? "Não" : "", key])];
    const sheet = utils.aoa_to_sheet(rows);
    sheet["!cols"] = [{ wch: 39 }, { wch: 84 }, { wch: 38 }, { hidden: true }];
    utils.book_append_sheet(workbook, sheet, tab);
  }
  const productRows = [productLabels, productHelp, productKeys];
  const productSheet = utils.aoa_to_sheet(productRows);
  productSheet["!cols"] = productKeys.map((key) => ({ wch: key === "description" ? 52 : key === "product_code" ? 25 : 20 }));
  productSheet["!rows"] = [{}, {}, { hidden: true }];
  utils.book_append_sheet(workbook, productSheet, "Produtos");
  const icmsRows = [icmsLabels, icmsHelp, icmsKeys];
  const icmsSheet = utils.aoa_to_sheet(icmsRows);
  icmsSheet["!cols"] = icmsKeys.map(() => ({ wch: 22 }));
  icmsSheet["!rows"] = [{}, {}, { hidden: true }];
  utils.book_append_sheet(workbook, icmsSheet, "ICMS");
  writeFile(workbook, "modelo-emissao-simplificada.xlsx");
}
