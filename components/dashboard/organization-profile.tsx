"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, Building2, LoaderCircle } from "lucide-react";
import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import type { Organization, OrganizationUpdate } from "@/lib/api/organization";
import { routes } from "@/lib/api/routes";
import { updateOrganization } from "@/lib/bff/organization";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";

export function OrganizationProfile() {
  const { user, organization } = useDashboardSession();
  const router = useRouter();
  const { data, error, mutate } = useSWR<Organization>(routes.bff.organization.me, bffFetcher, { fallbackData: organization });
  const [form, setForm] = useState<OrganizationUpdate>({ nome: organization.nome, cnpj: organization.cnpj, email: organization.email, telefone: organization.telefone });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setNotice("");
    try { const updated = await updateOrganization(form); await mutate(updated, { revalidate: false }); setNotice("Dados atualizados com sucesso."); router.refresh(); }
    catch (err) { setNotice(bffErrorMessage(err)); }
    finally { setSaving(false); }
  }
  return <div className="max-w-3xl">
    <Link href="/dashboard/configuracoes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Configurações</Link>
    <p className="eyebrow mt-8">Organização</p><h1 className="font-display mt-3 text-4xl font-semibold">Dados da organização</h1>
    <p className="mt-2 text-muted-foreground">Mantenha as informações de identificação e contato atualizadas.</p>
    <form onSubmit={submit} className="surface-card mt-8 space-y-5 p-6 sm:p-8">
      <Building2 className="text-sage-strong" size={25} />
      {error ? <p role="alert" className="text-sm text-destructive">{bffErrorMessage(error)}</p> : null}
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}
      <label className="block text-sm font-medium">Nome da organização<input className="field-input mt-2 w-full" required maxLength={255} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
      <label className="block text-sm font-medium">CNPJ<input className="field-input mt-2 w-full" maxLength={18} value={form.cnpj ?? ""} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></label>
      <label className="block text-sm font-medium">Email de contato<input className="field-input mt-2 w-full" type="email" maxLength={255} value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label className="block text-sm font-medium">Telefone<input className="field-input mt-2 w-full" type="tel" maxLength={64} value={form.telefone ?? ""} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></label>
      <p className="text-xs text-muted-foreground">Identificador interno: {data?.slug ?? organization.slug}. Apenas administradores podem editar.</p>
      {user.role === "admin" ? <button className="button button-primary" disabled={saving}>{saving && <LoaderCircle size={16} className="animate-spin" />} {saving ? "Salvando..." : "Salvar alterações"}</button> : null}
    </form>
  </div>;
}
