# Controle de Gastos — Dennis & Patrizzia

Webapp de controle financeiro do casal, mobile-first e instalável como PWA.
Substitui a planilha do Google Sheets com lançamento de gastos em 3-4 toques.

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Prisma 7 + PostgreSQL.

## Rodando no computador (desenvolvimento)

```bash
npm install        # 1ª vez (também gera o Prisma Client)
npm run db:start   # sobe o Postgres local do Prisma em background
npm run dev        # abre em http://localhost:3000
```

> O banco local roda embutido (sem instalar Postgres/Docker). Se as portas
> mudarem após reiniciar a máquina, rode `npx prisma dev ls` e ajuste a
> `DATABASE_URL` no `.env` com a URL "TCP" mostrada.

Outros scripts úteis:

| Script | O que faz |
| --- | --- |
| `npm run db:push` | Aplica o schema do Prisma no banco |
| `npm run db:seed` | Recria as 15 categorias padrão (não duplica) |
| `npm run db:studio` | Abre o Prisma Studio para inspecionar os dados |
| `node scripts/gerar-icones.mjs` | Regenera os ícones do PWA |

## Telas

- **Lançar (/)** — tela inicial: valor com teclado numérico já aberto, grade de
  categorias, forma de pagamento e responsável. "Mais detalhes" esconde os
  campos opcionais (nome, data, observação, parcelamento).
- **Resumo (/resumo)** — saldo do mês, fixos/variáveis/parcelas, pago × pendente,
  gastos por categoria (com %) e por forma de pagamento, entradas e lançamentos
  do mês. Filtros por responsável, categoria e forma; navegação entre meses.
- **Parcelas (/parcelas)** — compras parceladas em andamento ("X de Y") e
  projeção do total comprometido nos próximos meses.
- **Mais** — fixos/recorrentes, panorama anual, metas, investimentos,
  categorias e importação da planilha.

## Como funciona a lógica

- **Gastos fixos e receitas recorrentes** são modelos: as ocorrências de cada
  mês nascem sozinhas na primeira vez que o app é aberto naquele mês.
  Cada ocorrência pode ser editada ou **pausada só naquele mês** sem afetar os
  demais (excluir uma ocorrência de fixo = pausar, senão ela renasceria).
- **Compras parceladas** geram todas as parcelas futuras na hora do cadastro
  (uma por mês, a partir da data da 1ª parcela que você escolher). Meses
  futuros no Resumo/Panorama já mostram o valor previsto.
- **Saldo do mês** = entradas − (fixos + variáveis + parcelas do mês).
- Valores são armazenados em **centavos** (inteiros) para não haver erro de
  arredondamento.
- Datas usam o fuso **America/Sao_Paulo**, independente de onde o servidor roda.

## Importando a planilha antiga

1. No Google Sheets: **Arquivo → Fazer download → CSV** (uma aba/mês por vez).
2. No app: **Mais → Importar da planilha**, escolha Gastos ou Entradas,
   ajuste o mês/ano padrão e cole (ou envie) o CSV.
3. Colunas reconhecidas: Data, Descrição/Nome, Valor, Categoria, Forma,
   Responsável, Pago — só Descrição e Valor são obrigatórias. Datas aceitas:
   `15/03/2025`, `15/03` ou só `15`. Categorias desconhecidas são criadas
   automaticamente.

## Colocando no ar (Vercel + banco na nuvem)

1. **Crie o banco** (grátis): [Supabase](https://supabase.com) (Project →
   Connect → connection string "Transaction pooler") ou [Neon](https://neon.tech).
2. **Aplique o schema e as categorias** apontando para o banco novo:
   ```bash
   DATABASE_URL="postgresql://...sua-url..." npx prisma db push
   DATABASE_URL="postgresql://...sua-url..." npx prisma db seed
   ```
   (Para o CLI usar essa URL, remova/ignore a `MIGRATE_DATABASE_URL` do `.env`
   ou rode com `MIGRATE_DATABASE_URL` vazia.)
3. **Suba o código para o GitHub** e importe o repositório na
   [Vercel](https://vercel.com/new).
4. Em **Settings → Environment Variables** do projeto na Vercel, defina:
   - `DATABASE_URL` = connection string do Supabase/Neon
   - `APP_PIN` = um PIN (ex.: `2412`) — recomendado, senão o app fica aberto
     para qualquer pessoa com o link
5. Deploy. Pronto: o mesmo endereço funciona nos dois celulares, com os mesmos
   dados.

## Instalando no celular (PWA)

Abra o endereço do app no navegador do celular e:

- **iPhone (Safari):** botão Compartilhar → **Adicionar à Tela de Início**.
- **Android (Chrome):** menu ⋮ → **Adicionar à tela inicial** (ou o aviso
  "Instalar app").

O app abre em tela cheia, com ícone próprio, e o PIN fica salvo por 1 ano por
aparelho.
