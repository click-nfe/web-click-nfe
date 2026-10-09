"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { ArrowLeft, LoaderCircle, Plus, UsersRound } from "lucide-react";
import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import { Sheet } from "@/components/ui/sheet";
import { routes } from "@/lib/api/routes";
import { accessTagLabels, type AccessTag, type ManagedUser, type UserPayload } from "@/lib/api/users";
import { bffErrorMessage, bffFetcher } from "@/lib/bff/client";
import { saveUser } from "@/lib/bff/users";

const defaultForm: UserPayload = { nome: "", email: "", role: "operacao", setor: "", ativo: true, access_tags: ["processos"], password: "" };
const tags = Object.entries(accessTagLabels) as [AccessTag, string][];
export function UserManagement() {
  const { user } = useDashboardSession();
  const admin = user.role === "admin";
  const { data, error, mutate, isLoading } = useSWR<ManagedUser[]>(admin ? routes.bff.users.list : null, bffFetcher);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UserPayload>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  function start(item?: ManagedUser) {
    setEditing(item ?? null); setForm(item ? { nome: item.nome, email: item.email, role: item.role, setor: item.setor, ativo: item.ativo, access_tags: item.access_tags, password: "" } : { ...defaultForm });
    setNotice(""); setOpen(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setNotice("");
    try { await saveUser(form, editing?.id); await mutate(); setOpen(false); setNotice(editing ? "Usuário atualizado." : "Usuário cadastrado."); }
    catch (err) { setNotice(bffErrorMessage(err)); }
    finally { setSaving(false); }
  }
  return <>
    <Link href="/dashboard/configuracoes" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Configurações</Link>
    <div className="mt-8 flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">Acessos</p><h1 className="font-display mt-3 text-4xl font-semibold">Usuários</h1><p className="mt-2 text-muted-foreground">Cadastre pessoas e escolha os módulos acessíveis por tags.</p></div>
      {admin && <button type="button" className="button button-primary" onClick={() => start()}><Plus size={17} /> Novo usuário</button>}</div>
    {!admin ? <p className="surface-card mt-8 p-6">Apenas administradores podem gerenciar usuários.</p> : <section className="surface-card mt-8 divide-y divide-border overflow-hidden" aria-busy={isLoading}>
      {error && <p role="alert" className="p-6 text-destructive">{bffErrorMessage(error)}</p>}
      {notice && !open && <p role="status" className="p-6 text-sage-strong">{notice}</p>}
      {isLoading && <p className="p-6">Carregando usuários...</p>}
      {data?.map((item) => <button type="button" key={item.id} onClick={() => start(item)} className="flex w-full flex-wrap items-center justify-between gap-3 px-6 py-5 text-left transition hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-primary">
        <div><p className="font-semibold">{item.nome} {item.id === user.id && <span className="text-xs text-muted-foreground">(você)</span>}</p><p className="mt-1 text-sm text-muted-foreground">{item.email} · {item.role} · {item.ativo ? "Ativo" : "Inativo"}</p></div>
        <div className="flex flex-wrap gap-1">{(item.role === "admin" ? ["Admin · acesso total"] : item.access_tags.map((tag) => accessTagLabels[tag] ?? tag)).map((label) => <span key={label} className="rounded-full bg-sage-soft px-2.5 py-1 text-xs text-sage-strong">{label}</span>)}</div>
      </button>)}
      {!isLoading && !error && !data?.length && <div className="p-8 text-center"><UsersRound size={24} className="mx-auto text-sage-strong" /><p className="mt-3">Nenhum usuário cadastrado.</p></div>}
    </section>}
    <Sheet open={open} onOpenChange={setOpen} title={editing ? "Editar usuário" : "Novo usuário"} description="Defina as informações e tags que liberam cada módulo.">
      <form onSubmit={submit} className="space-y-4">
        {notice && <p role="alert" className="text-sm text-destructive">{notice}</p>}
        <label className="block text-sm font-medium">Nome<input required maxLength={255} className="field-input mt-1 w-full" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
        <label className="block text-sm font-medium">Email<input required type="email" maxLength={255} className="field-input mt-1 w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="block text-sm font-medium">Papel<select className="field-input mt-1 w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="operacao">Operação</option><option value="comercial">Comercial</option><option value="credenciamento">Credenciamento</option><option value="admin">Administrador</option></select></label>
        <label className="block text-sm font-medium">Setor<input maxLength={255} className="field-input mt-1 w-full" value={form.setor ?? ""} onChange={(e) => setForm({ ...form, setor: e.target.value })} /></label>
        {form.role === "admin" ? <p className="rounded-xl bg-sage-soft p-3 text-sm text-sage-strong">Administradores têm acesso a todos os módulos.</p> : <fieldset className="space-y-2"><legend className="text-sm font-medium">Tags de acesso</legend>{tags.map(([tag, label]) => <label key={tag} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="checkbox" checked={form.access_tags.includes(tag)} onChange={() => setForm({ ...form, access_tags: form.access_tags.includes(tag) ? form.access_tags.filter((value) => value !== tag) : [...form.access_tags, tag] })} />{label}</label>)}<p className="text-xs text-muted-foreground">Processos e emissão podem consultar clientes; apenas a tag Clientes permite alterá-los.</p></fieldset>}
        <label className="block text-sm font-medium">{editing ? "Nova senha (opcional)" : "Senha inicial"}<input type="password" minLength={8} required={!editing} autoComplete="new-password" className="field-input mt-1 w-full" value={form.password ?? ""} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        {editing && <label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={editing.id === user.id} checked={form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />Usuário ativo</label>}
        <button className="button button-primary w-full justify-center" disabled={saving || (form.role !== "admin" && !form.access_tags.length)}>{saving && <LoaderCircle size={16} className="animate-spin" />}{saving ? "Salvando..." : "Salvar usuário"}</button>
      </form>
    </Sheet>
  </>;
}
