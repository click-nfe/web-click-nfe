import axios from "axios";

/** Cliente same-origin usado pelo navegador; os cookies HttpOnly seguem seguros. */
export const bffClient = axios.create({
  timeout: 10_000,
  headers: { Accept: "application/json" },
  transitional: { clarifyTimeoutError: true },
});

export async function bffFetcher<T>(url: string) {
  try {
    const response = await bffClient.get<T>(url);
    return response.data;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      const next = `${window.location.pathname}${window.location.search}`;
      // A renovação precisa carregar o Route Handler como um novo documento.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `/api/auth/refresh?next=${encodeURIComponent(next)}`;
    }
    throw error;
  }
}

export function bffErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error ?? "Não foi possível carregar os dados.";
  }
  return "Não foi possível carregar os dados.";
}
