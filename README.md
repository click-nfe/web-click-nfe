# Click NFe — Web

Interface web do Click NFe para operações fiscais de importação via DUIMP.

## Requisitos

- Bun 1.1.33 ou compatível
- API Click NFe e PostgreSQL em execução pelos containers Docker

## Configuração local

```bash
cp .env.example .env.local
bun install
bun dev
```

A aplicação fica disponível em [http://localhost:3000](http://localhost:3000). Por padrão, o BFF acessa a API em `http://127.0.0.1:5000`.

## Variáveis de ambiente

| Variável | Uso | Padrão |
| --- | --- | --- |
| `API_URL` | URL interna da API, usada somente no servidor Next.js | `http://127.0.0.1:5000` |
| `API_TIMEOUT_MS` | Limite das requisições do Next.js para o Flask | `10000` |
| `REFRESH_TOKEN_MAX_AGE_SECONDS` | Duração do cookie de renovação | `604800` |

## Autenticação

O navegador conversa com as rotas `/api/auth/*` do Next.js. Os tokens retornados pela API são armazenados em cookies `HttpOnly`, sem exposição ao JavaScript do cliente. A área `/dashboard` exige uma sessão válida e tenta renovar o token de acesso quando necessário.

O formulário `/cadastro` cria uma organização e o primeiro administrador por `/api/auth/register`, que encaminha o pedido à API Flask. Depois do cadastro, o usuário entra em `/login`. A rota antiga `/demonstracao` redireciona para o novo formulário. Não configure `NEXT_PUBLIC_DEMO_REQUEST_URL`.

## Camada HTTP

O navegador chama o BFF do Next.js em `http://localhost:3000/api/*`. Esse endereço é intencional: somente o servidor Next.js acessa o Flask e os tokens permanecem em cookies `HttpOnly`.

- `lib/api/routes.ts`: dicionário central das rotas do Flask e do BFF.
- `lib/api/server-client.ts`: instância Axios exclusiva do servidor com `baseURL` e timeout.
- `lib/api/auth.ts`, `organization.ts` e `import-process.ts`: módulos por domínio, alinhados aos blueprints da API.
- `lib/bff/*`: chamadas same-origin do navegador; esta camada poderá ser usada como fetcher do SWR.

### Diagnóstico de conexão

Com os dois projetos em execução, valide cada salto separadamente:

```bash
curl http://127.0.0.1:5000/health
curl http://localhost:3000/api/health
```

Se o primeiro comando funcionar e o segundo retornar `502`, confira `API_URL` no `.env.local` e reinicie o `bun dev`. Se o frontend estiver em um container, `localhost` aponta para o próprio container; use o nome do serviço Docker, por exemplo `API_URL=http://api:5000`.
