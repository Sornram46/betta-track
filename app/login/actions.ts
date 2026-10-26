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

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!email || !password) {
    return { error: "กรุณากรอกอีเมลและรหัสผ่าน" };
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return { error: "เชื่อมต่อระบบยืนยันตัวตนไม่สำเร็จ ตรวจสอบว่า API กำลังทำงานอยู่" };
  }

  if (response.status === 401) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
  }
  if (!response.ok) {
    return { error: "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
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
