import type { PostalCodeLookup } from "@/lib/api/fiscal-reference";
import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export async function lookupPostalCode(zipCode: string) {
  const response = await bffClient.get<PostalCodeLookup>(
    routes.bff.fiscalReference.postalCode(zipCode),
  );
  return response.data;
}
