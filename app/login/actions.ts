"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

export type LoginState = { error: string | null };

function matches(supplied: string, expected: string) {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(supplied), hash(expected));
}

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!ownerEmail || !ownerPassword || !sessionSecret || sessionSecret.length < 32) {
    return { error: "ยังไม่ได้ตั้งค่า OWNER_EMAIL, OWNER_PASSWORD และ SESSION_SECRET (อย่างน้อย 32 ตัวอักษร) ใน .env.local" };
  }

  const email = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const password = formData.get("password")?.toString() ?? "";
  const emailMatches = matches(email, ownerEmail.trim().toLowerCase());
  const passwordMatches = matches(password, ownerPassword);

  if (!emailMatches || !passwordMatches) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
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
