import { forwardToBettaApi } from '../../../_lib/proxy';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return Response.json({ message: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 });
  }

  const image = formData.get('image');
  if (!image || typeof image === 'string') {
    return Response.json({ message: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 });
  }

  const role = new URL(request.url).searchParams.get('role');
  const roleQuery = role ? `?role=${encodeURIComponent(role)}` : '';

  return forwardToBettaApi(`/fish/${encodeURIComponent(id)}/image${roleQuery}`, {
    method: 'POST',
    body: formData,
  });
}