import { forwardToBettaApi } from '../_lib/proxy';

export async function GET() {
  return forwardToBettaApi('/fish');
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return Response.json({ message: 'ข้อมูลที่ส่งมาไม่ถูกต้อง' }, { status: 400 });
  }

  return forwardToBettaApi('/fish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}