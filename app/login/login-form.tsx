"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const inputClassName =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-500";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(login, { error: null });

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">อีเมล</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClassName} />
      </div>

      <div>
        <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">รหัสผ่าน</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClassName} />
      </div>

      {state.error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200" role="alert">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-wait disabled:opacity-60"
      >
        {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
