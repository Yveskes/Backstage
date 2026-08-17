"use client";

import { updatePassword, type AuthState } from "@/app/auth/actions";
import { useActionState } from "react";

export function PasswordSetupForm() {
  const [state, action, pending] = useActionState(updatePassword, null as AuthState | null);

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Wachtwoord instellen</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Je account is bevestigd. Kies nu een wachtwoord. Je start als medewerker.
      </p>

      {state?.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}

      <label className="mt-5 block text-sm">
        <span className="font-medium text-zinc-700">Wachtwoord</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={10}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
        />
      </label>
      <label className="mt-4 block text-sm">
        <span className="font-medium text-zinc-700">Bevestig wachtwoord</span>
        <input
          type="password"
          name="confirm"
          autoComplete="new-password"
          required
          minLength={10}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Bezig..." : "Opslaan en verder"}
      </button>
    </form>
  );
}
