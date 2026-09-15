import type { AxiosRequestConfig } from "axios";

import { apiClient, bearerConfig } from "@/lib/api/server-client";
import { routes } from "@/lib/api/routes";

export type ImportProcessListParams = {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
};

export async function listImportProcesses(
  accessToken: string,
  params?: ImportProcessListParams,
) {
  const config: AxiosRequestConfig = {
    ...bearerConfig(accessToken),
    params,
  };
  const response = await apiClient.get<unknown>(
    routes.backend.importProcess.list,
    config,
  );
  return response.data;
}

export async function getImportProcess(accessToken: string, id: string) {
  const response = await apiClient.get<unknown>(
    routes.backend.importProcess.detail(id),
    bearerConfig(accessToken),
  );
  return response.data;
}
