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
- `/coming-soon` — static placeholder page

**Key directories:**
- `lib/api/` — Bitbucket client (`bitbucket.ts`: `BASE_URL`, `getAuthHeader()`, axios) + `queryBuilder.ts` (pagelen/sort/query param builder)
- `lib/hooks/` — React Query hooks (all `'use client'`)
- `lib/types/` — shared TypeScript interfaces (`index.ts` + `pullrequest.ts`)
- `lib/utils/` — date formatting (`dateFormat.ts`), response mappers (`deploymentsMapper.ts`, `pullrequestActivityMapper.ts`)
- `lib/providers/` — `QueryProvider.tsx` wrapping app in `QueryClientProvider`
- `components/modules/` — composite dashboard sections (metric containers, tables, lists)
- `components/` — reusable UI primitives (cards, charts, dropdowns, skeletons)

## API Routes

All under `app/api/bitbucket/`, all GET:

| Endpoint | Purpose |
|---|---|
| `user/` | Validates creds, returns `{email}` from env |
| `workspaces/` | All Bitbucket workspaces |
| `repositories/[workspaceSlug]/` | Repos sorted by `-updated_on`, `pagelen=100` |
| `environments/[workspaceSlug]/[repositorySlug]/` | Deploy environments |
| `deployments/[workspaceSlug]/[repositorySlug]/` | Completed deployments, sorted `-state.started_on` |
| `pullrequests/[workspaceSlug]/[repositorySlug]/` | Paginated PRs with full activity per PR |
| `pullrequests/.../all/` | All PRs within `daysRange` for charts |
| `pullrequests/.../metrics/` | Open/merged/declined counts (3 parallel requests) |

## Hooks

All in `lib/hooks/`, all `'use client'`:

| Hook | Query key pattern | staleTime |
|---|---|---|
| `useWorkspaces` | `['workspaces']` | Infinity |
| `useRepositories` | `['repositories', slug]` | 300s |
| `useEnvironments` | `['environments', ws, repo]` | 300s |
| `useDeployments` | `['deployments', ws, repo]` | 300s |
| `usePullRequests` | `['pullRequests', ws, repo, state, page]` | default (keepPreviousData) |
| `useAllPullRequests` | `['allPullRequests', ws, repo, state, daysRange]` | default |
| `usePullRequestMetrics` | `['pullRequestMetrics', ws, repo]` | default |

## Types (`lib/types/`)

- `IWorkspace` — id, slug, name, isPrivate
- `IRepository` — id, name, description, slug, updatedOn, workspaceSlug
- `IPullRequest` — id, title, created, state, author
- `IPullRequestWithActivity extends IPullRequest` — adds comment, approval, merged timestamps
- `IPullRequestMetrics` — open, merged, declined (strings)
- `enum PullRequestState` — OPEN | MERGED | DECLINED
- `enum DeploymentStatus` — SUCCESSFUL | FAILED

## Key Dependencies

- `@tanstack/react-query ^5` — data fetching/caching
- `chart.js ^4` + `react-chartjs-2 ^5` — bar charts
- `date-fns ^4` — date math and formatting
- `@headlessui/react ^2` — accessible dropdowns, modals, disclosure
- `axios ^1` — HTTP client (used in API routes)
- `react-icons ^5` — icon set

## State management

TanStack React Query via `QueryProvider` in root layout. No other global state.

## Conventions

- **Path alias:** `@/*` maps to project root
- **All page/interactive components** are `'use client'` — no RSC data fetching yet
- **No middleware** — auth is checked per API route
- **ESLint:** `@typescript-eslint/no-explicit-any` is disabled
- **Styling:** Tailwind v4 utility classes, CSS vars for theme colors in `globals.css`
- **Layout:** Root layout applies Geist Sans/Mono fonts, `max-w-7xl` main area, `NavBar` always visible
