import { NextResponse } from 'next/server';
import { BASE_URL, getAuthHeader, axios } from '@/lib/api/bitbucket';
import { loadTeamConfig } from '@/lib/config/teamConfig';

// Bitbucket removed all account-wide enumeration endpoints (GET /2.0/workspaces,
// /2.0/user/permissions/workspaces) under CHANGE-2770 — they now return 410 Gone.
// Workspaces can no longer be discovered via the API, so we read the configured
// slug(s) from team-config.json and fetch each one individually
// (GET /2.0/workspaces/{slug} still works).

// Never let a browser cache these responses — errors (e.g. a transient 410) would
// otherwise stick, and the data is live anyway.
const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET() {
  try {
    const { workspace } = loadTeamConfig();
    const slugs = String(workspace ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (slugs.length === 0) {
      return NextResponse.json(
        { error: 'No workspace configured. Set "workspace" in team-config.json.' },
        { status: 400, headers: NO_STORE }
      );
    }

    const headers = getAuthHeader();
    const results = await Promise.allSettled(
      slugs.map((slug) => axios.get(`${BASE_URL}/workspaces/${slug}`, { headers }))
    );

    const values = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value.data);

    if (values.length === 0) {
      const firstError = results.find((r) => r.status === 'rejected') as
        | PromiseRejectedResult
        | undefined;
      const err: any = firstError?.reason;
      const status = err?.response?.status || 500;
      const message = err?.response?.data?.error?.message || err?.message || 'Failed to fetch workspaces';
      return NextResponse.json({ error: message }, { status, headers: NO_STORE });
    }

    return NextResponse.json(values, { headers: NO_STORE });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return NextResponse.json({ error: message }, { status, headers: NO_STORE });
  }
}
