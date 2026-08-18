"use client";

import { acceptInvite, type AuthState } from "@/app/auth/actions";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function InviteForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action, pending] = useActionState(acceptInvite, null as AuthState | null);

  if (!token) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
        Deze uitnodigingslink is ongeldig of onvolledig.
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-zinc-900">Uitnodiging accepteren</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Kies een wachtwoord. De link is 7 dagen geldig.
      </p>
      <input type="hidden" name="token" value={token} />

      {state?.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
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
        {pending ? "Bezig..." : "Account activeren"}
      </button>
    </form>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteForm />
    </Suspense>
  );
}
