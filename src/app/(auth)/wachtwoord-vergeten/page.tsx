"use client";

import { requestPasswordReset, type AuthState } from "@/app/auth/actions";
import Link from "next/link";
import { useActionState } from "react";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(
    requestPasswordReset,
    null as AuthState | null,
  );

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Wachtwoord vergeten</h2>
      <p className="mt-1 text-sm text-zinc-500">
        We sturen een herstellink als dit adres bij ons bekend is.
      </p>

      {state?.success ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
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
      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Bezig..." : "Stuur herstellink"}
      </button>
      <p className="mt-4 text-center text-sm text-zinc-500">
        <Link href="/login" className="hover:text-zinc-800">
          Terug naar inloggen
        </Link>
      </p>
    </form>
  );
}
