import axios from "axios";

/** Cliente same-origin usado pelo navegador; os cookies HttpOnly seguem seguros. */
export const bffClient = axios.create({
  timeout: 10_000,
  headers: { Accept: "application/json" },
  transitional: { clarifyTimeoutError: true },
});
