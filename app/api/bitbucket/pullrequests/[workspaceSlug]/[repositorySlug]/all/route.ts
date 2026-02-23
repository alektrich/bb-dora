import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL, getAuthHeader, axios } from '@/lib/api/bitbucket';
import { pullRequestWithActivityMapper } from '@/lib/utils/pullrequestActivityMapper';

async function getAllPullRequests(
  headers: Record<string, string>,
  workspaceSlug: string,
  repositorySlug: string,
  states: string[]
): Promise<any[]> {
  const allValues: any[] = [];
  let page = 1;

  while (true) {
    let url = `${BASE_URL}/repositories/${workspaceSlug}/${repositorySlug}/pullrequests?sort=-created_on&page=${page}`;
    states.forEach((state) => {
      url += `&state=${state}`;
    });

    const { data } = await axios.get(url, { headers });
    allValues.push(...data.values);
    if (!data.next) break;
    page++;
  }

  return allValues;
}

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
    const states = searchParams.getAll('state');

    const pullRequests = await getAllPullRequests(headers, workspaceSlug, repositorySlug, states);

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
