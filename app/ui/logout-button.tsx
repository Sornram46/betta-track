import { logout } from "@/app/login/actions";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        aria-label="Logout"
        title="Logout"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-100 transition hover:border-rose-500 hover:text-rose-300"
      >
        <LogOut size={18} aria-hidden="true" />
      </button>
    </form>
  );
}
