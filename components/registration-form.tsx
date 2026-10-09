"use client";

import axios from "axios";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { routes } from "@/lib/api/routes";
import { bffClient } from "@/lib/bff/client";

export function RegistrationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (values.password !== values.confirm_password) {
      setError("As senhas informadas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await bffClient.post(routes.bff.auth.register, {
        organization_name: values.organization_name.trim(),
        organization_slug: values.organization_slug.trim(),
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      router.push("/login?registered=1");
    } catch (requestError) {
      setError(axios.isAxiosError<{ error?: string }>(requestError)
        ? requestError.response?.data?.error ?? "Não foi possível concluir o cadastro. Tente novamente."
        : "Não foi possível concluir o cadastro. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="organization_name" className="field-label">Nome da organização</label>
        <input id="organization_name" name="organization_name" required maxLength={255} autoComplete="organization" className="field-input" placeholder="Grupo Casco" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="organization_slug" className="field-label">Identificador da organização</label>
        <input id="organization_slug" name="organization_slug" required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Use letras minúsculas, números e hífens" className="field-input" placeholder="casco-group" />
        <p className="mt-2 text-xs text-muted-foreground">Use letras minúsculas, números e hífens. Esse identificador deve ser único.</p>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="name" className="field-label">Nome do administrador</label>
        <input id="name" name="name" required maxLength={255} autoComplete="name" className="field-input" placeholder="Seu nome" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="email" className="field-label">E-mail de acesso</label>
        <input id="email" name="email" type="email" required maxLength={255} autoComplete="email" className="field-input" placeholder="voce@empresa.com.br" />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Senha</label>
        <input id="password" name="password" type="password" required minLength={16} maxLength={128} autoComplete="new-password" className="field-input" placeholder="Mínimo de 16 caracteres" />
      </div>
      <div>
        <label htmlFor="confirm_password" className="field-label">Confirme a senha</label>
        <input id="confirm_password" name="confirm_password" type="password" required minLength={16} maxLength={128} autoComplete="new-password" className="field-input" placeholder="Digite a senha novamente" />
      </div>
      {error && <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button type="submit" disabled={loading} className="button button-primary min-h-12 w-full sm:w-auto sm:px-7">
          {loading ? <LoaderCircle size={17} className="animate-spin" /> : <ArrowRight size={17} />}
          {loading ? "Criando acesso..." : "Cadastrar organização"}
        </button>
      </div>
    </form>
  );
}
