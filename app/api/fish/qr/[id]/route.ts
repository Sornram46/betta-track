import { forwardToBettaApi } from '../../../_lib/proxy';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  return forwardToBettaApi(`/fish/qr/${encodeURIComponent(id)}`);
}