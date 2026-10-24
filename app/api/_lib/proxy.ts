export async function forwardToBettaApi(path: string, init: RequestInit = {}) {
  const apiUrl = process.env.BETTA_API_URL?.replace(/\/$/, '');
  const accessToken = process.env.BETTA_API_ACCESS_TOKEN;

  if (!apiUrl || !accessToken) {
    return Response.json(
      { message: 'ตั้งค่า BETTA_API_URL และ BETTA_API_ACCESS_TOKEN ในไฟล์ .env.local ที่ root ก่อน' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...init.headers,
      },
      cache: 'no-store',
    });
    const data: unknown = await response.json().catch(() => null);
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json(
      { message: 'เชื่อมต่อ Betta Track API ไม่สำเร็จ ตรวจสอบว่า NestJS กำลังทำงานอยู่' },
      { status: 502 },
    );
  }
}