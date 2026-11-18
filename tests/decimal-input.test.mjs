import assert from "node:assert/strict";
import { test } from "node:test";

import { decimalInput, integerInput } from "../lib/decimal-input.ts";

test("normaliza decimais brasileiros e os valores já retornados pela API", () => {
  assert.equal(decimalInput("1.500,00", "Peso"), "1500.00");
  assert.equal(decimalInput("14,50000", "Peso"), "14.50000");
  assert.equal(decimalInput("14.50000", "Peso"), "14.50000");
  assert.equal(decimalInput("R$ 1.500,00", "Despesa"), "1500.00");
  assert.equal(decimalInput("", "Peso", true), null);
  assert.equal(integerInput("1.500", "Volumes"), 1500);
});

test("não envia valores ambíguos ou malformados como zero", () => {
  assert.throws(() => decimalInput("1.500,00,0", "Peso"), /Peso: informe um número válido/);
  assert.throws(() => decimalInput("12abc", "Peso"), /Peso: informe um número válido/);
});
