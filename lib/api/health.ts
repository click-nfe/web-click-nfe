import { apiClient } from "@/lib/api/server-client";
import { routes } from "@/lib/api/routes";

export async function getApiHealth() {
  const response = await apiClient.get<{ status: string }>(routes.backend.health);
  return response.data;
}
