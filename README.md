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

A aplicação fica disponível em [http://localhost:3000](http://localhost:3000). Por padrão, o BFF acessa a API em `http://localhost:5000`.

## Variáveis de ambiente

| Variável | Uso | Padrão |
| --- | --- | --- |
| `API_URL` | URL interna da API, usada somente no servidor Next.js | `http://localhost:5000` |
| `REFRESH_TOKEN_MAX_AGE_SECONDS` | Duração do cookie de renovação | `604800` |
| `NEXT_PUBLIC_DEMO_REQUEST_URL` | Destino do formulário comercial | envio desabilitado |

## Autenticação

O navegador conversa com as rotas `/api/auth/*` do Next.js. Os tokens retornados pela API são armazenados em cookies `HttpOnly`, sem exposição ao JavaScript do cliente. A área `/dashboard` exige uma sessão válida e tenta renovar o token de acesso quando necessário.

O cadastro público não é exposto no frontend. Novas organizações e usuários passam pelo fluxo controlado de demonstração e configuração.
