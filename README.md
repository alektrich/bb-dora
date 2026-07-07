# BB-DORA

DORA metrics dashboard for Bitbucket repositories. Built with Next.js 16, React 19, TypeScript, and Tailwind v4.

Original repo: https://github.com/mbagsik00/bitbucket-dora-metrics
- Updated to Next.js 16, React 19, TypeScript, and Tailwind v4.
- Using API token for authentication through env variables.
- Added Docker support.

## Prerequisites

- Node.js
- Bitbucket account

## Setup

### 1. Create a Bitbucket API Token

1. Go to **Account Settings** → **Security** → **Create and manage API tokens**
2. You will be asked to enter a secret code sent to the email associated with your Bitbucket account
3. Create a new API token (with scope) and add all **read** scopes to it
4. Copy the generated token value

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```
BB_EMAIL=your-bitbucket-email@example.com
BB_API_TOKEN=your-api-token-value
```

- `BB_EMAIL` — the email address associated with your Bitbucket account
- `BB_API_TOKEN` — the API token you created in step 1

### 3. Run the Project

```bash
npm i && npm run build && npm run start
```

The app will be available at http://localhost:6767

## Team Metrics (Engineering Effectiveness Scorecard)

The **Team Metrics** page (`/team-metrics`, linked from the nav bar) generates the exact column
rows the shared Engineering Effectiveness Google Sheet expects. Pick a workspace, repositories and a
date range, click **Generate**, then copy the per-month rows and the Team-Average row straight into
the sheet (tab-separated for paste, or Download CSV).

Two blocks are produced with identical metric columns:

- **Per-month rows** — one row per calendar month (`month, period, …25 metric columns`).
- **Team Average** — one aggregate row (`months_reported, …25 metric columns`) = mean across months.

**v1 scope:** the 13 Bitbucket-derived columns are computed automatically (PRs, reviews, PR size,
reverts, CI pipelines, deployments). The 11 issue-tracker columns (ClickUp/Notion — `issues_*`,
`cycles_count`, `bug_escape_rate_pct`, `pct_*`) are intentionally left **blank** to fill in the sheet
by hand.

### Configuration

Copy the example config and edit it (the real file is gitignored):

```bash
cp team-config.example.json team-config.json
```

| Key | Purpose |
|---|---|
| `team_size` | Default team size (divisor for per-dev metrics) |
| `team_size_overrides` | Per-month overrides, e.g. `{ "2026-01": 2 }` when the team was a different size |
| `thresholds.pr_max_age_days` | PR age SLA for `pr_age_compliance_pct` (default 7) |
| `thresholds.first_review_threshold_hours` | Review SLA for `review_time_compliance_pct` (default 24) |
| `main_branches` | Branches whose reverts count as change failures |
| `bot_reviewers` | Review-bot nicknames excluded from review metrics (e.g. `coderabbitai`) |
| `issue_key_regex` | Regex matching an issue key in PR title/description; blank ⇒ `unlinked_pr_rate_pct` left blank |
| `production_environments` | Deployment env names to count; empty ⇒ count all completed deployments |
| `repos` | Default repo slugs; empty ⇒ selectable in the UI / all repos in the workspace |

### Tests

The metrics engine (`lib/metrics/`) is pure and unit-tested:

```bash
npm test
```

### Docker

With `.env.local` configured, run:

```bash
docker compose up --build -d
```

The app will be available at http://localhost:6767.

To use a custom port:

```bash
PORT=9090 docker compose up --build -d
```

To stop:

```bash
docker compose down
```
