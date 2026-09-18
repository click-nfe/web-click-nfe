export const clientProfileSections = [
  "overview",
  "registration",
  "certificates",
  "fiscal-profile",
  "tax-rules",
  "processes",
] as const;

export type ClientProfileSection = (typeof clientProfileSections)[number];

export function isClientProfileSection(
  value: string | undefined,
): value is ClientProfileSection {
  return clientProfileSections.includes(value as ClientProfileSection);
}
