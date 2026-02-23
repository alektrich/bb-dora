import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL, getAuthHeader, axios } from '@/lib/api/bitbucket';
import { PullRequestState } from '@/lib/types/pullrequest';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string; repositorySlug: string }> }
) {
  try {
    const { workspaceSlug, repositorySlug } = await params;
    const headers = getAuthHeader();

    const getPullRequestURI = (state: PullRequestState) =>
      `${BASE_URL}/repositories/${workspaceSlug}/${repositorySlug}/pullrequests?state=${state}`;

    const [openPRs, mergedPRs, declinedPRs] = await Promise.all([
      axios.get(getPullRequestURI(PullRequestState.OPEN), { headers }),
      axios.get(getPullRequestURI(PullRequestState.MERGED), { headers }),
      axios.get(getPullRequestURI(PullRequestState.DECLINED), { headers }),
    ]);

    return NextResponse.json({
      open: openPRs.data.size,
      merged: mergedPRs.data.size,
      declined: declinedPRs.data.size,
    });
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
