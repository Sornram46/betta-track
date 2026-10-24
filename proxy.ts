import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC_EXACT = new Set(["/", "/login"]);
// QR scan pages must stay readable without an account.
const PUBLIC_PREFIXES = ["/fish/qr/", "/api/fish/qr/"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_EXACT.has(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const secret = process.env.SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (secret && token && (await verifySessionToken(token, secret))) {
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
