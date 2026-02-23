# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # dev server on :6767
npm run build      # production build
npm run lint       # ESLint
npm run start      # production server on :6767
```

No test framework configured yet.

## Architecture

Next.js 16 app (React 19, TypeScript, Tailwind v4) — a DORA metrics dashboard for Bitbucket repositories. Uses App Router.

**Data flow:** Client components → React Query hooks (`lib/hooks/`) → Next.js API routes (`app/api/bitbucket/`) → Bitbucket REST API v2.0.

API routes act as a proxy to Bitbucket, handling auth server-side via `BB_EMAIL` and `BB_API_TOKEN` env vars (Basic auth). Client hooks fetch from `/api/bitbucket/*` and transform Bitbucket's snake_case responses into app types.

**Route structure:**
- `/` — workspace list
- `/[workspaceSlug]/repositories` — repository list
- `/[workspaceSlug]/repositories/[repositorySlug]/dashboard` — main dashboard with deployment metrics, PR metrics, charts

**Key directories:**
- `lib/api/` — Bitbucket client config and query builder
- `lib/hooks/` — React Query hooks (all `'use client'`)
- `lib/types/` — shared TypeScript interfaces
- `lib/utils/` — date formatting, response mappers
- `components/modules/` — composite dashboard sections (metric containers, tables)
- `components/` — reusable UI primitives

**State management:** TanStack React Query via `QueryProvider` in root layout. No other global state. `staleTime: Infinity` on workspace/repository queries (treat as static).

**Path alias:** `@/*` maps to project root.
