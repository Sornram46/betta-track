import { requireAdmin } from "../../_lib/auth";
import { forwardToBettaApi } from "../../_lib/proxy";

export async function GET(_request: Request, ctx: RouteContext<"/api/fish/[id]">) {
  const { id } = await ctx.params;
  return forwardToBettaApi(`/fish/${encodeURIComponent(id)}`);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/fish/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ message: "ข้อมูลที่ส่งมาไม่ถูกต้อง" }, { status: 400 });
  }

  return forwardToBettaApi(`/fish/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/fish/[id]">) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await ctx.params;
  return forwardToBettaApi(`/fish/${encodeURIComponent(id)}`, { method: "DELETE" });
}
