import { NextResponse } from 'next/server';

export async function GET() {
  const email = process.env.BB_EMAIL;
  const token = process.env.BB_API_TOKEN;

  if (!email || !token) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 401 });
  }

  return NextResponse.json({ email });
}
