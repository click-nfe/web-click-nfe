import type { Metadata } from "next";
import { UserManagement } from "@/components/dashboard/user-management";
export const metadata: Metadata = { title: "Usuários | Configurações" };
export default function UsersPage() { return <UserManagement />; }
