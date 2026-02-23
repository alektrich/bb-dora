import { NextResponse } from 'next/server';
import { BASE_URL, getAuthHeader, axios } from '@/lib/api/bitbucket';

export async function GET() {
  try {
    const headers = getAuthHeader();
    const { data } = await axios.get(`${BASE_URL}/workspaces`, { headers });
    return NextResponse.json(data.values);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.error?.message || error.message;
    return NextResponse.json({ error: message }, { status });
  }
}
