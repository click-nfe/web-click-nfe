export const taxRegimeLabels: Record<string, string> = {
  "1": "Simples Nacional",
  "2": "Simples Nacional — excesso de sublimite",
  "3": "Regime Normal",
};

export function cnpjCharacters(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 14);
}

export function formatCnpj(value: string) {
  const characters = cnpjCharacters(value);
  return characters
    .replace(/^([A-Z0-9]{2})([A-Z0-9])/, "$1.$2")
    .replace(/^([A-Z0-9]{2})\.([A-Z0-9]{3})([A-Z0-9])/, "$1.$2.$3")
    .replace(/\.([A-Z0-9]{3})([A-Z0-9])/, ".$1/$2")
    .replace(/([A-Z0-9]{4})(\d)/, "$1-$2");
}

function cnpjCheckDigit(base: string, weights: number[]) {
  const total = base
    .split("")
    .reduce(
      (sum, character, index) =>
        sum + (character.charCodeAt(0) - 48) * weights[index],
      0,
    );
  const remainder = total % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function isValidCnpj(value: string) {
  const characters = cnpjCharacters(value);
  if (!/^[A-Z0-9]{12}\d{2}$/.test(characters)) return false;
  if (/^(\d)\1{13}$/.test(characters)) return false;

  const first = cnpjCheckDigit(characters.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = cnpjCheckDigit(`${characters.slice(0, 12)}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return characters.endsWith(`${first}${second}`);
}

export function formatCnae(code: string, description: string) {
  const digits = code.replace(/\D/g, "").padStart(7, "0").slice(-7);
  const formattedCode = `${digits.slice(0, 4)}-${digits.slice(4, 5)}/${digits.slice(5)}`;
  return description ? `${formattedCode} — ${description}` : formattedCode;
}

export function formatClientDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
