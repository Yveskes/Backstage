"use client";

import { saveUserModules } from "@/app/(app)/medewerkers/actions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StarIcon, TrashIcon } from "@/components/icons";
import { BuildRewardPills } from "@/components/build-reward-pills";
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
import { halvesFor } from "@/lib/staff-planning";
import {
  afbouwDayOptions,
  clearFestivalPost,
  festivalIncludesFriday,
  festivalSchedulePatch,
  availableHalves,
  constrainHalves,
  halfDayOptions,
  isFestivalTask,
  opbouwDayOptions,
  planningDayOptions,
  staffTaskOptionsFor,
  toggleFestivalPostDay,
  withoutFestivalFriday,
  worksOnDay,
  type HalfDayId,
  type OpbouwDayId,
  type PlanningDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";
import { formatTshirtSizes, hasConfirmedTshirt } from "@/lib/tshirts";
import { pillClass } from "@/lib/pills";

function sameModules(a: ModuleId[], b: ModuleId[]) {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function HalfDayPills({
  kind,
  dayId,
  active,
  canManage,
  onToggle,
}: {
  kind: "opbouw" | "afbouw";
  dayId: string;
  active: HalfDayId[];
  canManage: boolean;
  onToggle: (half: HalfDayId) => void;
}) {
  return (
    <div className="grid min-w-0 flex-1 grid-cols-2 gap-1 sm:grid-cols-[6.25rem_6.25rem] sm:flex-none">
      {halfDayOptions.map((half) => {
        if (!availableHalves(kind, dayId).includes(half.id)) {
          return <div key={half.id} aria-hidden />;
        }

        return (
          <button
            key={half.id}
            type="button"
            disabled={!canManage}
            title={half.id === "am" ? "Voormiddag" : "Namiddag"}
            onClick={() => onToggle(half.id)}
            className={`${pillClass(active.includes(half.id))} w-full text-center`}
          >
            {half.id === "am" ? "Voormiddag" : "Namiddag"}
          </button>
        );
      })}
    </div>
  );
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
      <div className="mt-3 space-y-2">
        {moduleOptions.map((option) => {
          const checked = draft.includes(option.id);

          return (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-zinc-200 px-3 py-2"
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!canEdit || saving}
                onChange={() => toggle(option.id)}
              />
              <span className="text-sm font-medium text-zinc-900">{option.label}</span>
            </label>
          );
        })}
      </div>
      {canEdit && dirty ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
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
  const { planning, posts, toggleLead, clearLeadIf, clearAttendance, toggleHalf } = useStaffPlanning();
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

    if (isFestivalTask(taskId)) {
      if (selected) {
        const tasks = person.tasks.filter((id) => id !== taskId);
        const byDay = clearFestivalPost(person.festivalByDay ?? {}, taskId);
        updateUser(person.id, festivalSchedulePatch(tasks, byDay, person.opbouwDays));
        clearLeadIf(taskId, person.id);
      } else {
        updateUser(person.id, {
          tasks: [...person.tasks, taskId],
        });
      }
      setLeadError(null);
      return;
    }

    const nextTasks = selected ? person.tasks.filter((id) => id !== taskId) : [...person.tasks, taskId];
    const opbouwDays = taskId === "opbouw" && selected ? [] : person.opbouwDays;
    const afbouwDays = taskId === "afbouw" && selected ? [] : person.afbouwDays;

    updateUser(person.id, {
      tasks: nextTasks,
      opbouwDays,
      afbouwDays,
    });

    if (selected) {
      if (taskId === "opbouw" || taskId === "afbouw") {
        clearAttendance(person.id, taskId);
      }
    }
    setLeadError(null);
  }

  function setFestivalDay(postId: StaffTaskId, day: PlanningDayId) {
    const byDay = toggleFestivalPostDay(person.festivalByDay ?? {}, postId, day);
    updateUser(person.id, festivalSchedulePatch(person.tasks, byDay, person.opbouwDays));
    if (festivalIncludesFriday(byDay)) {
      clearAttendance(person.id, "opbouw", "friday");
    }
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

  function handleBuildHalf(kind: "opbouw" | "afbouw", day: string, half: HalfDayId) {
    const present = constrainHalves(kind, day, halvesFor(planning, kind, day, person.id));
    const dayList = kind === "opbouw" ? person.opbouwDays : person.afbouwDays;
    const assigned = (dayList as string[]).includes(day);
    const allowed = availableHalves(kind, day);
    if (!allowed.includes(half)) {
      return;
    }
    const virtualFull = assigned && present.length === 0;
    const active: HalfDayId[] = virtualFull ? allowed : present;
    const turningOff = active.includes(half);
    const remaining = turningOff ? active.filter((entry) => entry !== half) : [...active, half];

    if (virtualFull) {
      for (const keep of remaining) {
        toggleHalf(kind, day, person.id, keep);
      }
    } else {
      toggleHalf(kind, day, person.id, half);
    }

    if (remaining.length === 0) {
      updateUser(person.id, {
        [kind === "opbouw" ? "opbouwDays" : "afbouwDays"]: dayList.filter((id) => id !== day),
      });
      return;
    }

    const nextDays = assigned ? dayList : [...dayList, day];
    if (kind === "opbouw" && day === "friday") {
      const opbouwDays: OpbouwDayId[] = assigned ? person.opbouwDays : [...person.opbouwDays, "friday"];
      updateUser(
        person.id,
        festivalSchedulePatch(person.tasks, withoutFestivalFriday(person.festivalByDay ?? {}), opbouwDays),
      );
      return;
    }

    updateUser(person.id, {
      [kind === "opbouw" ? "opbouwDays" : "afbouwDays"]: nextDays,
    });
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
      <BuildRewardPills person={person} className="mt-3" />

      <section className="mt-5 rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Taken</h2>
        <div className="mt-3 flex flex-wrap gap-1">
          {taskOptions
            .filter((task) => isFestivalTask(task.id))
            .map((task) => (
              <button
                key={task.id}
                type="button"
                disabled={!canManage}
                onClick={() => toggleTask(task.id)}
                className={pillClass(person.tasks.includes(task.id))}
              >
                {task.label}
              </button>
            ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-1">
          {taskOptions
            .filter((task) => task.id === "opbouw" || task.id === "afbouw")
            .map((task) => (
              <button
                key={task.id}
                type="button"
                disabled={!canManage}
                onClick={() => toggleTask(task.id)}
                className={pillClass(person.tasks.includes(task.id))}
              >
                {task.label}
              </button>
            ))}
        </div>

        {person.tasks.some(isFestivalTask) || person.tasks.includes("opbouw") || person.tasks.includes("afbouw") ? (
          <div className="mt-4 space-y-3 border-t border-zinc-200 pt-4">
            {person.tasks.some(isFestivalTask) ? (
              <div className="space-y-3">
                {person.tasks.filter(isFestivalTask).map((taskId) => {
                  const task = taskOptions.find((option) => option.id === taskId);
                  const post = posts.find((entry) => entry.id === taskId);
                  const isLead = planning.responsible[taskId] === person.id;

                  return (
                    <div key={taskId} className="space-y-1.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                        <h3 className="shrink-0 text-sm font-semibold text-zinc-900">
                          {task?.label ?? taskId}
                        </h3>
                        <div className="flex flex-wrap gap-1">
                          {planningDayOptions.map((day) => {
                            const allowed = !post || worksOnDay(post.days, day.id);
                            return (
                              <button
                                key={day.id}
                                type="button"
                                disabled={!canManage || !allowed}
                                onClick={() => setFestivalDay(taskId, day.id)}
                                className={pillClass((person.festivalByDay ?? {})[day.id] === taskId)}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          disabled={!canManage}
                          onClick={() => handleToggleLead(taskId)}
                          title={isLead ? "Verantwoordelijke" : "Maak verantwoordelijke"}
                          className="ml-auto shrink-0 rounded p-0.5 text-zinc-300 hover:text-amber-500 disabled:opacity-60"
                        >
                          <StarIcon
                            filled={isLead}
                            className={`h-5 w-5 ${isLead ? "text-amber-500" : ""}`}
                          />
                          <span className="sr-only">
                            {isLead ? `Verantwoordelijke ${task?.label}` : `Maak verantwoordelijke van ${task?.label}`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {leadError ? (
                  <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
                    {leadError}
                  </p>
                ) : null}
              </div>
            ) : null}

            {person.tasks.includes("opbouw") ? (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Opbouw</h3>
                <div className="mt-2 space-y-1">
                  {opbouwDayOptions.map((day) => {
                    const present = constrainHalves("opbouw", day.id, halvesFor(planning, "opbouw", day.id, person.id));
                    const assigned = person.opbouwDays.includes(day.id);
                    const active = assigned && present.length === 0 ? availableHalves("opbouw", day.id) : present;

                    return (
                      <div key={day.id} className="flex items-center gap-3">
                        <p className="w-24 shrink-0 text-sm text-zinc-700">{day.label}</p>
                        <HalfDayPills
                          kind="opbouw"
                          dayId={day.id}
                          active={active}
                          canManage={canManage}
                          onToggle={(half) => handleBuildHalf("opbouw", day.id, half)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {person.tasks.includes("afbouw") ? (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Afbouw</h3>
                <div className="mt-2 space-y-1">
                  {afbouwDayOptions.map((day) => {
                    const present = constrainHalves("afbouw", day.id, halvesFor(planning, "afbouw", day.id, person.id));
                    const assigned = person.afbouwDays.includes(day.id);
                    const active = assigned && present.length === 0 ? availableHalves("afbouw", day.id) : present;

                    return (
                      <div key={day.id} className="flex items-center gap-3">
                        <p className="w-24 shrink-0 text-sm text-zinc-700">{day.label}</p>
                        <HalfDayPills
                          kind="afbouw"
                          dayId={day.id}
                          active={active}
                          canManage={canManage}
                          onToggle={(half) => handleBuildHalf("afbouw", day.id, half)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-900">T-shirt</h2>
        <p className="mt-1 text-sm">
          {hasConfirmedTshirt(person) ? (
            <span className="text-emerald-800">Bevestigd: {formatTshirtSizes(person)}</span>
          ) : (
            <span className="text-red-800">
              Nog niet bevestigd{person.tshirtSize ? ` (voorstel ${formatTshirtSizes(person)})` : ""}
            </span>
          )}
          <span className="text-zinc-500">
            {" "}
            · vorig jaar {person.tshirtSizeLastYear ?? "onbekend"}
          </span>
        </p>
      </section>

      {user.kind === "team" ? (
        <section className="mt-3 rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Menu</h2>
          <MenuModulesEditor person={person} canEdit={canEditRights} />
        </section>
      ) : null}

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
