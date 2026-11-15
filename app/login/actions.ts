"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export type LoginState = { error: string | null };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const sessionSecret = process.env.SESSION_SECRET;
  const apiUrl = process.env.BETTA_API_URL?.replace(/\/$/, "");
  const accessToken = process.env.BETTA_API_ACCESS_TOKEN;

  if (!sessionSecret || sessionSecret.length < 32) {
    return { error: "ยังไม่ได้ตั้งค่า SESSION_SECRET (อย่างน้อย 32 ตัวอักษร) ใน .env.local" };
  }
  if (!apiUrl || !accessToken) {
    return { error: "ยังไม่ได้ตั้งค่า BETTA_API_URL และ BETTA_API_ACCESS_TOKEN ใน .env.local" };
  }

  const username = formData.get("username")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!username || !password) {
    return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "เชื่อมต่อระบบยืนยันตัวตนไม่สำเร็จ ตรวจสอบว่า API กำลังทำงานอยู่" };
  }

  if (response.status === 401) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }
  if (!response.ok) {
    // Log the backend's reply server-side (visible in Render logs) so failures can be diagnosed.
    // Never log the submitted password.
    const detail = await response.text().catch(() => "");
    // `server`, `retry-after` and `x-render-routing` headers show which layer (Render edge, Cloudflare, NestJS) replied.
    const headerInfo = ["server", "retry-after", "x-render-routing", "cf-ray"]
      .map((name) => `${name}=${response.headers.get(name) ?? "-"}`)
      .join(" ");
    console.error(
      `[login] backend responded ${response.status} for ${apiUrl}/auth/login [${headerInfo}]: ${detail.slice(0, 500)}`,
    );

    if (response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      return {
        error: `มีการเรียกระบบถี่เกินไป (429) กรุณารอ${retryAfter ? ` ${retryAfter} วินาที` : "สักครู่"}แล้วลองใหม่`,
      };
    }

    if (response.status === 404) {
      return { error: "ไม่พบระบบยืนยันตัวตนบน API (404) ตรวจสอบว่า backend deploy เวอร์ชันล่าสุดแล้ว" };
    }
    if (response.status >= 500) {
      return { error: `API ขัดข้อง (${response.status}) กรุณาลองใหม่อีกครั้ง หรือตรวจสอบ log ของ backend` };
    }
    return { error: `เข้าสู่ระบบไม่สำเร็จ (${response.status}) กรุณาลองใหม่อีกครั้ง` };
  }

  (await cookies()).set(SESSION_COOKIE, await createSessionToken(sessionSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
