"use client";

import { createInvite, type AuthState } from "@/app/auth/actions";
import { useUsers } from "@/components/users-provider";
import { canAssignRoles, canManageStaff, createNewUser, kindLabel, type UserKind } from "@/lib/permissions";
import { useActionState, useEffect, useRef, useState } from "react";

type InviteDraft = { firstName: string; lastName: string; email: string; kind: UserKind };

function CopyInviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-zinc-700">Deel deze link zelf</p>
      <div className="mt-1 flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={url}
          className="min-w-0 flex-1 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
        >
          {copied ? "Gekopieerd" : "Kopieer link"}
        </button>
      </div>
    </div>
  );
}

export function AddStaffForm() {
  const { addUser, currentUser } = useUsers();
  const [state, action, pending] = useActionState(createInvite, null as AuthState | null);
  const lastRef = useRef<InviteDraft>({ firstName: "", lastName: "", email: "", kind: "staff" });
  const canAdd = canManageStaff(currentUser);
  const canInviteTeam = canAssignRoles(currentUser);
  const [kind, setKind] = useState<UserKind>("staff");

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

  const invitingTeam = canInviteTeam && kind === "team";

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
      className="mb-8 rounded border border-zinc-200 bg-zinc-50 p-5"
    >
      {state?.error ? (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>
      ) : null}
      {state?.success ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <p>{state.success}</p>
          {state.inviteUrl ? <CopyInviteLink url={state.inviteUrl} /> : null}
        </div>
      ) : null}

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-zinc-800">Type</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white">
            <input
              type="radio"
              name="kind"
              value="staff"
              checked={kind === "staff"}
              onChange={() => setKind("staff")}
              className="sr-only"
            />
            {kindLabel.staff}
          </label>
          {canInviteTeam ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm text-zinc-800 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-900 has-[:checked]:text-white">
              <input
                type="radio"
                name="kind"
                value="team"
                checked={kind === "team"}
                onChange={() => setKind("team")}
                className="sr-only"
              />
              {kindLabel.team}
            </label>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {invitingTeam
            ? "Alleen admin. Er gaat geen mail uit: jij kopieert de link en deelt die zelf (WhatsApp, mail, …)."
            : "Medewerkers zien hun eigen pagina en chat. Team Zeverrock nodig? Dat kan alleen een admin via een link."}
        </p>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_auto]">
        <input
          name="firstName"
          placeholder="Voornaam"
          autoComplete="given-name"
          required
          className="rounded border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <input
          name="lastName"
          placeholder="Naam"
          autoComplete="family-name"
          required
          className="rounded border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <input
          type="email"
          name="email"
          placeholder="E-mail"
          autoComplete="email"
          required
          className="rounded border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Bezig..." : invitingTeam ? "Link maken" : "Medewerker uitnodigen"}
        </button>
      </div>
    </form>
  );
}
