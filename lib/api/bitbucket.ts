import axios from 'axios';

export const BASE_URL = 'https://api.bitbucket.org/2.0';

export function getAuthHeader() {
  const email = process.env.BB_EMAIL;
  const token = process.env.BB_API_TOKEN;
  if (!email || !token) throw new Error('Missing BB_EMAIL or BB_API_TOKEN env vars');
  const encoded = Buffer.from(`${email}:${token}`).toString('base64');
  return { Authorization: `Basic ${encoded}` };
}

export { axios };
