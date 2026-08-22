"use client";

import { useRef, useState, type DragEvent } from "react";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import {
  COMBI_HALF_DAYS,
  TOKENS_PER_HALF,
  buildRewardsCsv,
  downloadBuildRewardsCsv,
  rewardsForUsers,
} from "@/lib/build-rewards";
import { assignedHalves, halvesFor } from "@/lib/staff-planning";
import {
  afbouwDayOptions,
  halfDayOptions,
  availableHalves,
  constrainHalves,
  opbouwDayOptions,
  type AfbouwDayId,
  type BuildTaskId,
  type OpbouwDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";
import type { AppUser } from "@/lib/permissions";
import { pillClass } from "@/lib/pills";

type DragPayload = {
  userId: string;
  fromKind?: BuildTaskId;
  fromDay?: string;
  unassigned?: boolean;
};

const columns: {
  kind: BuildTaskId;
  label: string;
  days: { id: string; label: string }[];
}[] = [
  { kind: "opbouw", label: "Opbouw", days: opbouwDayOptions },
  { kind: "afbouw", label: "Afbouw", days: afbouwDayOptions },
];

function byName(a: AppUser, b: AppUser) {
  return a.fullName.localeCompare(b.fullName, "nl");
}

function peopleForDay(users: AppUser[], kind: BuildTaskId, day: string) {
  if (kind === "opbouw") {
    return users.filter((user) => user.tasks.includes("opbouw") && user.opbouwDays.includes(day as OpbouwDayId));
  }

  return users.filter((user) => user.tasks.includes("afbouw") && user.afbouwDays.includes(day as AfbouwDayId));
}

function uniqueDays<T extends string>(days: T[]) {
  return days.filter((day, index, all) => all.indexOf(day) === index);
}

function withTask(tasks: StaffTaskId[], task: BuildTaskId) {
  return tasks.includes(task) ? tasks : [...tasks, task];
}

function withoutTaskIfEmpty(tasks: StaffTaskId[], task: BuildTaskId, remainingDays: string[]) {
  if (remainingDays.length > 0) {
    return tasks;
  }

  return tasks.filter((entry) => entry !== task);
}

export function BuildPlanning() {
  const { users, updateUser } = useUsers();
  const { planning, toggleAssignedHalfDay, setHalves, clearAttendance } = useStaffPlanning();
  const [overKey, setOverKey] = useState<string | null>(null);
  const dragging = useRef(false);
  const rewards = rewardsForUsers(users, planning);
  const combiCount = rewards.filter((row) => row.combiTicket).length;
  const tokenTotal = rewards.reduce((sum, row) => sum + row.tokens, 0);

  const unassigned = users
    .filter(
      (user) =>
        (user.tasks.includes("opbouw") && user.opbouwDays.length === 0) ||
        (user.tasks.includes("afbouw") && user.afbouwDays.length === 0),
    )
    .sort(byName);

  function movePerson(payload: DragPayload, toKind: BuildTaskId, toDay: string) {
    if (!payload.unassigned && payload.fromKind === toKind && payload.fromDay === toDay) {
      return;
    }

    const user = users.find((entry) => entry.id === payload.userId);
    if (!user) {
      return;
    }

    let tasks = user.tasks;
    let opbouwDays = user.opbouwDays;
    let afbouwDays = user.afbouwDays;

    if (!payload.unassigned && payload.fromKind && payload.fromDay) {
      if (payload.fromKind === "opbouw") {
        opbouwDays = opbouwDays.filter((day) => day !== payload.fromDay);
        tasks = withoutTaskIfEmpty(tasks, "opbouw", opbouwDays);
      } else {
        afbouwDays = afbouwDays.filter((day) => day !== payload.fromDay);
        tasks = withoutTaskIfEmpty(tasks, "afbouw", afbouwDays);
      }

      clearAttendance(user.id, payload.fromKind, payload.fromDay);
    }

    if (toKind === "opbouw") {
      opbouwDays = uniqueDays([...opbouwDays, toDay as OpbouwDayId]);
      tasks = withTask(tasks, "opbouw");
    } else {
      afbouwDays = uniqueDays([...afbouwDays, toDay as AfbouwDayId]);
      tasks = withTask(tasks, "afbouw");
    }

    updateUser(user.id, { tasks, opbouwDays, afbouwDays });

    const marked = constrainHalves(toKind, toDay, halvesFor(planning, toKind, toDay, user.id));
    if (marked.length === 0) {
      setHalves(toKind, toDay, user.id, availableHalves(toKind, toDay));
    }
  }

  function onDropCell(event: DragEvent, toKind: BuildTaskId, toDay: string) {
    event.preventDefault();
    setOverKey(null);

    try {
      const raw = event.dataTransfer.getData("application/json");
      const payload = JSON.parse(raw) as DragPayload;
      if (!payload.userId) {
        return;
      }

      movePerson(payload, toKind, toDay);
    } catch {
      return;
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-zinc-500">
        Duid per persoon VM en/of NM aan; minstens één moet aanstaan. {COMBI_HALF_DAYS} halve
        dagen op- of afbouw = combiticket. Per halve dag = {TOKENS_PER_HALF} drankjetons.
      </p>

      {unassigned.length > 0 ? (
        <section className="rounded border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-900">Nog geen dag</h2>
          <ul className="mt-3 space-y-1">
            {unassigned.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => {
                    dragging.current = true;
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({ userId: user.id, unassigned: true } satisfies DragPayload),
                    );
                  }}
                  className="w-full cursor-grab rounded bg-white px-3 py-1.5 text-left text-sm text-red-900 active:cursor-grabbing"
                >
                  {user.fullName || user.email}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {columns.map((column) => (
          <section key={column.kind}>
            <h2 className="text-base font-semibold text-zinc-900">{column.label}</h2>
            <div className="mt-3 space-y-3">
              {column.days.map((day) => {
                const people = peopleForDay(users, column.kind, day.id).sort(byName);
                const dropKey = `${column.kind}:${day.id}`;

                return (
                  <div
                    key={day.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setOverKey(dropKey);
                    }}
                    onDragLeave={() => {
                      setOverKey((current) => (current === dropKey ? null : current));
                    }}
                    onDrop={(event) => onDropCell(event, column.kind, day.id)}
                    className={`rounded border px-3 py-3 ${
                      overKey === dropKey ? "border-zinc-900 bg-zinc-100" : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    <p className="mb-2 text-sm font-medium text-zinc-900">{day.label}</p>

                    {people.length === 0 ? null : (
                      <ul className="space-y-1">
                        {people.map((user) => {
                          const present = assignedHalves(planning, column.kind, day.id, user.id);

                          return (
                            <li
                              key={user.id}
                              className="flex flex-wrap items-center gap-2 rounded bg-white px-2 py-1.5"
                            >
                              <button
                                type="button"
                                draggable
                                onDragStart={(event) => {
                                  dragging.current = true;
                                  event.dataTransfer.effectAllowed = "move";
                                  event.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({
                                      userId: user.id,
                                      fromKind: column.kind,
                                      fromDay: day.id,
                                    } satisfies DragPayload),
                                  );
                                }}
                                onDragEnd={() => {
                                  setOverKey(null);
                                  window.setTimeout(() => {
                                    dragging.current = false;
                                  }, 0);
                                }}
                                className="min-w-0 flex-1 cursor-grab truncate text-left text-sm text-zinc-800 active:cursor-grabbing"
                                title="Sleep naar een andere dag."
                              >
                                {user.fullName || user.email}
                              </button>

                              <span className="flex items-center gap-1">
                                {halfDayOptions.map((half) => {
                                  const allowed = availableHalves(column.kind, day.id).includes(half.id);
                                  if (!allowed) {
                                    return (
                                      <span
                                        key={half.id}
                                        aria-hidden
                                        className={`${pillClass(false)} invisible pointer-events-none`}
                                      >
                                        {half.label}
                                      </span>
                                    );
                                  }

                                  const on = present.includes(half.id);

                                  return (
                                    <button
                                      key={half.id}
                                      type="button"
                                      aria-pressed={on}
                                      onClick={() =>
                                        toggleAssignedHalfDay(column.kind, day.id, user.id, half.id)
                                      }
                                      className={pillClass(on)}
                                    >
                                      {half.label}
                                    </button>
                                  );
                                })}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded border border-zinc-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-900">Vergoedingen</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {combiCount} combiticket{combiCount === 1 ? "" : "s"} · {tokenTotal} drankjetons in totaal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadBuildRewardsCsv(buildRewardsCsv(rewards))}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
          >
            Lijst downloaden
          </button>
        </div>

        {rewards.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">Nog niemand ingepland voor op- of afbouw.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Naam</th>
                  <th className="px-4 py-3 font-medium">Halve dagen</th>
                  <th className="px-4 py-3 font-medium">Drankjetons</th>
                  <th className="px-4 py-3 font-medium">Combiticket</th>
                </tr>
              </thead>
              <tbody>
                {rewards.map((row) => (
                  <tr key={row.userId} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-zinc-900">{row.fullName}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.halfDays}</td>
                    <td className="px-4 py-3 text-zinc-600">{row.tokens}</td>
                    <td className="px-4 py-3">
                      {row.combiTicket ? (
                        <span className="text-emerald-800">Ja</span>
                      ) : (
                        <span className="text-zinc-400">Nee</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
