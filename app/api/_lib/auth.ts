import { cookies } from "next/headers";
import { isAdmin, readSessionToken, SESSION_COOKIE, type Session } from "@/lib/session";

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return readSessionToken(token, process.env.SESSION_SECRET);
}

/** Returns an error response when the current user is not an admin, otherwise null. */
export async function requireAdmin(): Promise<Response | null> {
  const session = await getSession();
  if (!session) {
    return Response.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  if (!isAdmin(session)) {
    return Response.json({ message: "เฉพาะผู้ดูแลระบบ (admin) เท่านั้นที่แก้ไขหรือลบปลาได้" }, { status: 403 });
  }
  return null;
}
