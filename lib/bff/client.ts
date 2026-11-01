import axios from "axios";

/** Cliente same-origin usado pelo navegador; os cookies HttpOnly seguem seguros. */
export const bffClient = axios.create({
  timeout: 35_000,
  headers: { Accept: "application/json" },
  transitional: { clarifyTimeoutError: true },
});

export async function bffFetcher<T>(url: string): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await bffClient.get<T>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
        const next = `${window.location.pathname}${window.location.search}`;
        // A renovação precisa carregar o Route Handler como um novo documento.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/api/auth/refresh?next=${encodeURIComponent(next)}`;
        return new Promise<T>(() => undefined);
      }
      const temporary = axios.isAxiosError(error) && (
        ["ETIMEDOUT", "ECONNABORTED", "ERR_NETWORK"].includes(error.code ?? "") ||
        [502, 503, 504].includes(error.response?.status ?? 0)
      );
      if (attempt === 0 && temporary) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Não foi possível carregar os dados.");
}

export function bffErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ error?: string; message?: string }>(error)) {
    return (
      error.response?.data?.message ??
      error.response?.data?.error ??
      "Não foi possível carregar os dados."
    );
  }
  return "Não foi possível carregar os dados.";
}
