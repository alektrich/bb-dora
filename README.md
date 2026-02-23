# BB-DORA

DORA metrics dashboard for Bitbucket repositories. Built with Next.js 16, React 19, TypeScript, and Tailwind v4.

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
