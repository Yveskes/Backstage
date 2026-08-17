"use client";

import { logout } from "@/app/auth/actions";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="w-full rounded-md px-2 py-1.5 text-left text-xs text-zinc-400 hover:text-zinc-200"
      >
        Uitloggen
      </button>
    </form>
  );
}
