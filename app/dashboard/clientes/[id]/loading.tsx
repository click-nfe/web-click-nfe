export default function ClientProfileLoading() {
  return (
    <div className="space-y-6" aria-label="Carregando perfil do cliente">
      <div className="h-8 w-44 animate-pulse rounded-full bg-muted" />
      <div className="h-44 animate-pulse rounded-2xl bg-muted" />
      <div className="h-14 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-52 animate-pulse rounded-2xl bg-muted" />
        <div className="h-52 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}
