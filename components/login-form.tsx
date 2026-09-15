"use client";

import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }

      window.location.assign(nextPath);
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="email" className="field-label">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          placeholder="voce@empresa.com.br"
          className="field-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="field-label">Senha</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="Sua senha"
            className="field-input pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground transition hover:text-foreground"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="button button-primary min-h-12 w-full">
        {loading ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowRight size={17} />}
        {loading ? "Entrando..." : "Entrar na plataforma"}
      </button>
    </form>
  );
}
