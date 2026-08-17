"use client";

import { login, type AuthState } from "@/app/auth/actions";
import Link from "next/link";
import { useActionState } from "react";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null as AuthState | null);

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Inloggen</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Alleen met een uitnodiging. Nieuwe accounts zijn standaard medewerker.
      </p>

      {state?.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <label className="mt-5 block text-sm">
        <span className="font-medium text-zinc-700">E-mail</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
        />
      </label>
      <label className="mt-4 block text-sm">
        <span className="font-medium text-zinc-700">Wachtwoord</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Bezig..." : "Inloggen"}
      </button>
      <p className="mt-4 text-center text-sm text-zinc-500">
        <Link href="/wachtwoord-vergeten" className="hover:text-zinc-800">
          Wachtwoord vergeten?
        </Link>
      </p>
    </form>
  );
}
