"use client";

import { saveUserModules } from "@/app/(app)/medewerkers/actions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TrashIcon } from "@/components/icons";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import {
  canAssignRoles,
  canManageStaff,
  canRemoveDirectoryPerson,
  homePath,
  kindLabel,
  moduleOptions,
  type AppUser,
  type ModuleId,
} from "@/lib/permissions";
import {
  afbouwDayOptions,
  isFestivalTask,
  opbouwDayOptions,
  staffDayOptions,
  staffTaskOptionsFor,
  toggleId,
  type StaffDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";

function sameModules(a: ModuleId[], b: ModuleId[]) {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function MenuModulesEditor({
  person,
  canEdit,
}: {
  person: AppUser;
  canEdit: boolean;
}) {
  const { updateUser } = useUsers();
  const [draft, setDraft] = useState<ModuleId[]>(person.modules);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dirty = !sameModules(draft, person.modules);

  useEffect(() => {
    setDraft(person.modules);
    setMessage(null);
    setError(null);
  }, [person.id]);

  useEffect(() => {
    if (!dirty) {
      setDraft(person.modules);
    }
  }, [person.modules, dirty]);

  function toggle(moduleId: ModuleId) {
    setDraft((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId],
    );
    setMessage(null);
    setError(null);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const result = await saveUserModules(person.email, draft);
    updateUser(person.id, { modules: draft });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setMessage("Opgeslagen.");
  }

  return (
    <>
      <div className="mt-5 space-y-3">
        {moduleOptions.map((option) => {
          const checked = draft.includes(option.id);

          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 px-4 py-3"
            >
              <input
                type="checkbox"
                className="mt-1"
                checked={checked}
                disabled={!canEdit || saving}
                onChange={() => toggle(option.id)}
              />
              <span>
                <span className="block text-sm font-medium text-zinc-900">{option.label}</span>
                <span className="mt-0.5 block text-sm text-zinc-500">{option.description}</span>
              </span>
            </label>
          );
        })}
      </div>
      {canEdit && dirty ? (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Opslaan..." : "Opslaan"}
          </button>
          <p className="text-sm text-zinc-500">Niet opgeslagen.</p>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-zinc-600">{message}</p> : null}
      {error ? (
        <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}
    </>
  );
}

export default function MedewerkerDetailPage() {
  const params = useParams<{ userId: string }>();
  const { users, currentUser, sessionUser, updateUser, removeUser, setCurrentUserId } = useUsers();
  const { planning, posts, toggleLead, clearLeadIf, clearAttendance } = useStaffPlanning();
  const router = useRouter();
  const user = users.find((entry) => entry.id === params.userId);
  const [leadError, setLeadError] = useState<string | null>(null);

  if (!user) {
    return <p className="text-sm text-zinc-500">Deze persoon bestaat niet.</p>;
  }

  const person = user;
  const taskOptions = staffTaskOptionsFor(posts);
  const isAdmin = canAssignRoles(currentUser);
  const canManage = canManageStaff(currentUser);
  const canEditRights = isAdmin && person.kind !== "admin";
  const canDelete = canRemoveDirectoryPerson(sessionUser, person);

  function toggleTask(taskId: StaffTaskId) {
    const selected = person.tasks.includes(taskId);
    const next = selected
      ? person.tasks.filter((id) => id !== taskId)
      : [...person.tasks, taskId];

    updateUser(person.id, {
      tasks: next,
      opbouwDays: taskId === "opbouw" && selected ? [] : person.opbouwDays,
      afbouwDays: taskId === "afbouw" && selected ? [] : person.afbouwDays,
    });

    if (selected) {
      clearLeadIf(taskId, person.id);
      if (taskId === "opbouw" || taskId === "afbouw") {
        clearAttendance(person.id, taskId);
      }
    }
    setLeadError(null);
  }

  function handleToggleLead(taskId: StaffTaskId) {
    if (!isFestivalTask(taskId)) {
      return;
    }
    const result = toggleLead(taskId, person.id);
    if (result.ok) {
      setLeadError(null);
      return;
    }

    const holder = users.find((entry) => entry.id === result.holderId);
    const post = taskOptions.find((task) => task.id === taskId)?.label ?? taskId;
    setLeadError(`${holder?.fullName ?? "Iemand anders"} is al verantwoordelijke voor ${post}.`);
  }

  function setDays(days: StaffDayId) {
    updateUser(person.id, { days: person.days === days ? null : days });
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      person.kind === "admin"
        ? `${person.fullName} (${person.email}) verwijderen? Dit extra admin-account verdwijnt uit de lijst.`
        : `${person.fullName} verwijderen? Deze persoon verdwijnt uit de lijst.`,
    );
    if (!confirmed) {
      return;
    }

    const result = await removeUser(person.id);
    if (result.error) {
      window.alert(result.error);
      return;
    }

    router.push("/medewerkers");
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
        <div className="flex shrink-0 items-center gap-1">
          <span className="rounded bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-900">
            {kindLabel[user.kind]}
          </span>
          {canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-700"
              aria-label={`${user.fullName} verwijderen`}
              title="Verwijderen"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-1 text-sm text-zinc-500">{user.email}</p>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">Taken</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Duid aan waar deze persoon ingezet wordt.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {taskOptions.map((task) => {
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

        {person.tasks.some(isFestivalTask) ? (
          <div className="mt-6 space-y-2">
            <h3 className="text-sm font-semibold text-zinc-900">Verantwoordelijke</h3>
            <p className="text-sm text-zinc-500">
              Eén persoon per post. Zet de toggle aan als deze persoon verantwoordelijke is.
            </p>
            {leadError ? (
              <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                {leadError}
              </p>
            ) : null}
            {person.tasks.filter(isFestivalTask).map((taskId) => {
              const task = taskOptions.find((option) => option.id === taskId);
              const isLead = planning.responsible[taskId] === person.id;

              return (
                <label
                  key={taskId}
                  className="flex items-center justify-between gap-3 rounded border border-zinc-200 px-3 py-2"
                >
                  <span className="text-sm text-zinc-800">
                    {task?.label ?? taskId}
                    {isLead ? " *" : ""}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isLead}
                    disabled={!canManage}
                    onClick={() => handleToggleLead(taskId)}
                    className={`relative h-5 w-9 rounded-full transition-colors disabled:opacity-60 ${
                      isLead ? "bg-zinc-900" : "bg-zinc-200"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                        isLead ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                    <span className="sr-only">Verantwoordelijke {task?.label}</span>
                  </button>
                </label>
              );
            })}
          </div>
        ) : null}

        {person.tasks.includes("opbouw") ? (
          <>
            <h3 className="mt-6 text-sm font-semibold text-zinc-900">Opbouw</h3>
            <p className="mt-1 text-sm text-zinc-500">Maandag tot vrijdag.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {opbouwDayOptions.map((day) => {
                const selected = person.opbouwDays.includes(day.id);

                return (
                  <button
                    key={day.id}
                    type="button"
                    disabled={!canManage}
                    onClick={() => {
                      updateUser(person.id, { opbouwDays: toggleId(person.opbouwDays, day.id) });
                      if (selected) {
                        clearAttendance(person.id, "opbouw", day.id);
                      }
                    }}
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
          </>
        ) : null}

        {person.tasks.includes("afbouw") ? (
          <>
            <h3 className="mt-6 text-sm font-semibold text-zinc-900">Afbouw</h3>
            <p className="mt-1 text-sm text-zinc-500">Zondag tot woensdag.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {afbouwDayOptions.map((day) => {
                const selected = person.afbouwDays.includes(day.id);

                return (
                  <button
                    key={day.id}
                    type="button"
                    disabled={!canManage}
                    onClick={() => {
                      updateUser(person.id, { afbouwDays: toggleId(person.afbouwDays, day.id) });
                      if (selected) {
                        clearAttendance(person.id, "afbouw", day.id);
                      }
                    }}
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
          </>
        ) : null}

        {person.tasks.some((task) => isFestivalTask(task)) ? (
          <>
            <h3 className="mt-6 text-sm font-semibold text-zinc-900">Festival</h3>
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
          </>
        ) : null}
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
            Deze medewerker heeft de standaardtoegang: eigen pagina en meldingen.
            Extra backstage-onderdelen kan alleen admin aanzetten.
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
            <MenuModulesEditor person={person} canEdit={canEditRights} />
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
      </div>
    </div>
  );
}
