import { NextResponse, type NextRequest } from "next/server";
import { isAdmin, readSessionToken, SESSION_COOKIE } from "@/lib/session";

const PUBLIC_EXACT = new Set(["/", "/login"]);
// QR scan pages must stay readable without an account.
const PUBLIC_PREFIXES = ["/fish/qr/", "/api/fish/qr/"];
// Pages only an admin (owner) may open. The API routes check the role themselves.
const ADMIN_PAGE_PATTERN = /^\/fish\/[^/]+\/edit\/?$/;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const session = await readSessionToken(request.cookies.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
  if (session) {
    if (ADMIN_PAGE_PATTERN.test(pathname) && !isAdmin(session)) {
      return NextResponse.redirect(new URL("/fish", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
