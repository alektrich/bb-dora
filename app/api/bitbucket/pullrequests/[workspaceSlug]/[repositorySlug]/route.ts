import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL, getAuthHeader, axios } from '@/lib/api/bitbucket';
import { pullRequestWithActivityMapper } from '@/lib/utils/pullrequestActivityMapper';

async function getPullRequestActivity(
  headers: Record<string, string>,
  workspaceSlug: string,
  repositorySlug: string,
  pullrequestId: string
): Promise<any[]> {
  const values: any[] = [];
  let url: string | null =
    `${BASE_URL}/repositories/${workspaceSlug}/${repositorySlug}/pullrequests/${pullrequestId}/activity?pagelen=20`;

  while (url) {
    const response: { data: { values: any[]; next?: string } } = await axios.get(url, { headers });
    values.push(...response.data.values);
    url = response.data.next || null;
  }

  return values;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string; repositorySlug: string }> }
) {
  try {
    const { workspaceSlug, repositorySlug } = await params;
    const headers = getAuthHeader();
    const { searchParams } = new URL(request.url);

    const page = searchParams.get('page') || '1';
    const states = searchParams.getAll('state');

    let pullRequestURL = `${BASE_URL}/repositories/${workspaceSlug}/${repositorySlug}/pullrequests?sort=-created_on&page=${page}`;

    if (states.length > 0) {
      states.forEach((state) => {
        pullRequestURL += `&state=${state}`;
      });
    }

    const { data } = await axios.get(pullRequestURL, { headers });
    const pullRequests = data.values;

    const activities = await Promise.all(
      pullRequests.map(async (pr: any) => {
        const activityList = await getPullRequestActivity(
          headers,
          workspaceSlug,
          repositorySlug,
          pr.id
        );

        return {
          id: pr.id,
          title: pr.title,
          created_on: pr.created_on,
          state: pr.state,
          author: pr.author.display_name,
          activities: activityList
        };
      })
    );

    const mapped = activities.map(pullRequestWithActivityMapper);
    return NextResponse.json(mapped);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
