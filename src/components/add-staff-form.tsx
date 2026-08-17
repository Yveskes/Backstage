"use client";

import { createInvite, type AuthState } from "@/app/auth/actions";
import { useUsers } from "@/components/users-provider";
import { canAssignRoles, canManageStaff, createNewUser, kindLabel, type UserKind } from "@/lib/permissions";
import { useActionState, useEffect, useRef } from "react";

type InviteDraft = { firstName: string; lastName: string; email: string; kind: UserKind };

export function AddStaffForm() {
  const { addUser, currentUser } = useUsers();
  const [state, action, pending] = useActionState(createInvite, null as AuthState | null);
  const lastRef = useRef<InviteDraft>({ firstName: "", lastName: "", email: "", kind: "staff" });
  const canAdd = canManageStaff(currentUser);
  const canInviteTeam = canAssignRoles(currentUser);

  useEffect(() => {
    if (!state?.success || !lastRef.current.email) {
      return;
    }

    addUser(createNewUser(lastRef.current));
    lastRef.current = { firstName: "", lastName: "", email: "", kind: "staff" };
  }, [addUser, state?.success]);

  if (!canAdd) {
    return null;
  }

  return (
    <form
      action={(formData) => {
        lastRef.current = {
          firstName: String(formData.get("firstName") ?? ""),
          lastName: String(formData.get("lastName") ?? ""),
          email: String(formData.get("email") ?? ""),
          kind: formData.get("kind") === "team" ? "team" : "staff",
        };
        return action(formData);
      }}
      className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <h2 className="text-base font-semibold text-zinc-900">Uitnodigen</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Kies of het een medewerker is of iemand van het team. Berichten gebruiken
        altijd de voornaam.
      </p>

      {state?.error ? (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.error}
        </p>
      ) : null}
      {state?.success ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <p>{state.success}</p>
          {state.inviteUrl ? (
            <p className="mt-2 break-all text-xs text-emerald-900">{state.inviteUrl}</p>
          ) : null}
        </div>
      ) : null}

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-zinc-800">Type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white">
            <input type="radio" name="kind" value="staff" defaultChecked className="sr-only" />
            {kindLabel.staff}
          </label>
          {canInviteTeam ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white">
              <input type="radio" name="kind" value="team" className="sr-only" />
              {kindLabel.team}
            </label>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Medewerkers zien hun eigen pagina en chat. Teamleden krijgen later de
          backstage-onderdelen toegewezen.
        </p>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
        <input
          name="firstName"
          placeholder="Voornaam"
          autoComplete="given-name"
          required
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <input
          name="lastName"
          placeholder="Naam"
          autoComplete="family-name"
          required
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          autoComplete="email"
          required
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Bezig..." : "Uitnodigen"}
        </button>
      </div>
    </form>
  );
}
