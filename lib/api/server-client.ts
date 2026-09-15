import axios from "axios";

const DEFAULT_API_URL = "http://127.0.0.1:5000";
const DEFAULT_TIMEOUT_MS = 10_000;

function getApiUrl() {
  return (process.env.API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "");
}

function getApiTimeout() {
  const configured = Number(process.env.API_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_TIMEOUT_MS;
}

/** Cliente exclusivo do servidor Next.js. Nunca importe em Client Components. */
export const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: getApiTimeout(),
  headers: { Accept: "application/json" },
  transitional: { clarifyTimeoutError: true },
});

export function bearerConfig(accessToken: string) {
  return {
    headers: { Authorization: `Bearer ${accessToken}` },
  };
}

export function getApiTarget() {
  return apiClient.defaults.baseURL ?? DEFAULT_API_URL;
}
