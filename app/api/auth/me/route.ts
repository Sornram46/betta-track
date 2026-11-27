import { getSession } from "../../_lib/auth";
import { isAdmin } from "@/lib/session";

/** Tells the UI who is logged in so it can show or hide admin-only buttons. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  return Response.json({ username: session.username, role: session.role, isAdmin: isAdmin(session) });
}
