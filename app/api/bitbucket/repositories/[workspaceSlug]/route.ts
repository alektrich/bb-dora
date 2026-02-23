import { NextRequest, NextResponse } from 'next/server';
import { BASE_URL, getAuthHeader, axios } from '@/lib/api/bitbucket';
import { queryStringBuilder } from '@/lib/api/queryBuilder';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceSlug: string }> }
) {
  try {
    const { workspaceSlug } = await params;
    const headers = getAuthHeader();

    let url = `${BASE_URL}/repositories/${workspaceSlug}?`;
    url = queryStringBuilder(url, { limit: 100, sort: '-updated_on' });

    const { data } = await axios.get(url, { headers });
    return NextResponse.json(data.values);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
