"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUsers } from "@/components/users-provider";
import {
  canAssignRoles,
  canManageStaff,
  homePath,
  kindLabel,
  moduleOptions,
  type ModuleId,
  type UserKind,
} from "@/lib/permissions";
import {
  staffDayOptions,
  staffTaskOptions,
  type StaffDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";

export default function MedewerkerDetailPage() {
  const params = useParams<{ userId: string }>();
  const { users, currentUser, sessionUser, updateUser, removeUser, setCurrentUserId } = useUsers();
  const router = useRouter();
  const user = users.find((entry) => entry.id === params.userId);

  if (!user) {
    return <p className="text-sm text-zinc-500">Deze persoon bestaat niet.</p>;
  }

  const person = user;
  const isAdmin = canAssignRoles(currentUser);
  const canManage = canManageStaff(currentUser);
  const canEditRights = isAdmin && person.kind !== "admin";
  const canDelete = canManage && person.id !== sessionUser.id && person.kind !== "admin";

  function toggleModule(moduleId: ModuleId) {
    const next = person.modules.includes(moduleId)
      ? person.modules.filter((id) => id !== moduleId)
      : [...person.modules, moduleId];
    updateUser(person.id, { modules: next });
  }

  function toggleTask(taskId: StaffTaskId) {
    const next = person.tasks.includes(taskId)
      ? person.tasks.filter((id) => id !== taskId)
      : [...person.tasks, taskId];
    updateUser(person.id, { tasks: next });
  }

  function setDays(days: StaffDayId) {
    updateUser(person.id, { days: person.days === days ? null : days });
  }

  function setKind(kind: UserKind) {
    if (kind === "staff" && person.kind === "team") {
      const confirmed = window.confirm(
        `${person.fullName} wordt medewerker en verliest de teamonderdelen. Doorgaan?`,
      );
      if (!confirmed) {
        return;
      }
    }

    updateUser(person.id, {
      kind,
      modules: kind === "team" ? person.modules : [],
    });
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `${person.fullName} verwijderen? Deze persoon verdwijnt uit de lijst.`,
    );
    if (!confirmed) {
      return;
    }

    if (removeUser(person.id)) {
      router.push("/medewerkers");
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="text-sm text-zinc-500">
        <Link href="/medewerkers" className="hover:text-zinc-800">
          Medewerkers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">{user.fullName}</span>
      </p>
      <div className="mt-2 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{user.fullName}</h1>
        {canEditRights ? (
          <select
            value={person.kind}
            onChange={(event) => setKind(event.target.value as UserKind)}
            aria-label="Type"
            className="shrink-0 appearance-none rounded bg-zinc-900 px-3 py-1.5 text-sm text-white"
          >
            <option value="staff">{kindLabel.staff}</option>
            <option value="team">{kindLabel.team}</option>
          </select>
        ) : (
          <span className="shrink-0 rounded bg-zinc-900 px-3 py-1.5 text-sm text-white">
            {kindLabel[user.kind]}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-zinc-500">{user.email}</p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Taken</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Duid aan waar deze persoon ingezet wordt.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {staffTaskOptions.map((task) => {
            const selected = person.tasks.includes(task.id);

            return (
              <button
                key={task.id}
                type="button"
                disabled={!canManage}
                onClick={() => toggleTask(task.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  selected
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {task.label}
              </button>
            );
          })}
        </div>

        <h3 className="mt-6 text-sm font-semibold text-zinc-900">Dag</h3>
        <p className="mt-1 text-sm text-zinc-500">Vrijdag, zaterdag of beide dagen.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {staffDayOptions.map((day) => {
            const selected = person.days === day.id;

            return (
              <button
                key={day.id}
                type="button"
                disabled={!canManage}
                onClick={() => setDays(day.id)}
                className={`rounded-full px-3 py-1.5 text-sm ${
                  selected
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 bg-white text-zinc-700"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">T-shirt</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Vorig jaar: {person.tshirtSizeLastYear ?? "onbekend"}. Dit jaar kiest de medewerker zelf en moet bevestigen.
        </p>
        <p className="mt-3 text-sm text-zinc-800">
          {person.tshirtConfirmed
            ? `Bevestigd: ${person.tshirtSize}`
            : `Nog niet bevestigd${person.tshirtSize ? ` (voorstel ${person.tshirtSize})` : ""}`}
        </p>
      </section>

      {user.kind === "staff" ? (
        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-900">Toegang</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Deze medewerker heeft de standaardtoegang: eigen pagina, meldingen en
            chat. Extra backstage-onderdelen kan alleen admin aanzetten.
          </p>
        </section>
      ) : (
        <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-base font-semibold text-zinc-900">Onderdelen in het menu</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Zet aan wat deze persoon mag beheren. Uitgeschakelde onderdelen verdwijnen uit de navigatie.
          </p>

          {user.kind === "admin" ? (
            <p className="mt-4 text-sm text-zinc-700">Admin heeft toegang tot alle onderdelen.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {moduleOptions.map((option) => {
                const checked = user.modules.includes(option.id);

                return (
                  <label
                    key={option.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      disabled={!canEditRights}
                      onChange={() => toggleModule(option.id)}
                    />
                    <span>
                      <span className="block text-sm font-medium text-zinc-900">{option.label}</span>
                      <span className="mt-0.5 block text-sm text-zinc-500">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {isAdmin && user.id !== currentUser.id ? (
          <button
            type="button"
            onClick={() => {
              setCurrentUserId(user.id);
              router.push(homePath(user));
            }}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Bekijk de app als {user.fullName}
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-800 hover:bg-red-50"
          >
            Medewerker verwijderen
          </button>
        ) : null}
      </div>
    </div>
  );
}
