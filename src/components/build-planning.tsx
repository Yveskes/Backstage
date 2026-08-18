"use client";

import { CheckIcon, StarIcon } from "@/components/icons";
import { useRef, useState, type DragEvent } from "react";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import { formatFill, isPostComplete, isPostUnderfilled } from "@/lib/staff-planning";
import {
  afbouwDayOptions,
  opbouwDayOptions,
  type AfbouwDayId,
  type OpbouwDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";
import type { AppUser } from "@/lib/permissions";

type BuildKind = "opbouw" | "afbouw";

type DragPayload = {
  userId: string;
  fromKind?: BuildKind;
  fromDay?: string;
  unassigned?: boolean;
};

const columns: {
  kind: BuildKind;
  label: string;
  days: { id: string; label: string }[];
}[] = [
  { kind: "opbouw", label: "Opbouw", days: opbouwDayOptions },
  { kind: "afbouw", label: "Afbouw", days: afbouwDayOptions },
];

function byName(a: AppUser, b: AppUser) {
  return a.fullName.localeCompare(b.fullName, "nl");
}

function peopleForDay(users: AppUser[], kind: BuildKind, day: string) {
  if (kind === "opbouw") {
    return users.filter((user) => user.tasks.includes("opbouw") && user.opbouwDays.includes(day as OpbouwDayId));
  }

  return users.filter((user) => user.tasks.includes("afbouw") && user.afbouwDays.includes(day as AfbouwDayId));
}

function parseNeed(raw: string) {
  const trimmed = raw.trim();
  const parsed = trimmed === "" ? null : Number(trimmed);
  return parsed === null || !Number.isFinite(parsed) || parsed < 0 ? null : Math.round(parsed);
}

function uniqueDays<T extends string>(days: T[]) {
  return days.filter((day, index, all) => all.indexOf(day) === index);
}

function withTask(tasks: StaffTaskId[], task: BuildKind) {
  return tasks.includes(task) ? tasks : [...tasks, task];
}

function withoutTaskIfEmpty(tasks: StaffTaskId[], task: BuildKind, remainingDays: string[]) {
  if (remainingDays.length > 0) {
    return tasks;
  }

  return tasks.filter((entry) => entry !== task);
}

export function BuildPlanning() {
  const { users, updateUser } = useUsers();
  const { planning, setNeed } = useStaffPlanning();
  const [overKey, setOverKey] = useState<string | null>(null);
  const dragging = useRef(false);

  const unassigned = users
    .filter(
      (user) =>
        (user.tasks.includes("opbouw") && user.opbouwDays.length === 0) ||
        (user.tasks.includes("afbouw") && user.afbouwDays.length === 0),
    )
    .sort(byName);

  function movePerson(payload: DragPayload, toKind: BuildKind, toDay: string) {
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
    }

    if (toKind === "opbouw") {
      opbouwDays = uniqueDays([...opbouwDays, toDay as OpbouwDayId]);
      tasks = withTask(tasks, "opbouw");
    } else {
      afbouwDays = uniqueDays([...afbouwDays, toDay as AfbouwDayId]);
      tasks = withTask(tasks, "afbouw");
    }

    updateUser(user.id, { tasks, opbouwDays, afbouwDays });
  }

  function onDropCell(event: DragEvent, toKind: BuildKind, toDay: string) {
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
    <div className="space-y-4">
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
                const people = peopleForDay(users, column.kind, day.id);
                const responsibleId = planning.responsible[column.kind];
                const ordered = [
                  ...people.filter((user) => user.id === responsibleId),
                  ...people.filter((user) => user.id !== responsibleId).sort(byName),
                ];
                const needed = planning.needed[column.kind]?.[day.id] ?? null;
                const underfilled = isPostUnderfilled(needed, people.length);
                const complete = isPostComplete(needed, people.length);
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
                    className={`relative rounded border px-3 py-3 ${
                      overKey === dropKey
                        ? "border-zinc-900 bg-zinc-100"
                        : underfilled
                          ? "border-red-200 bg-red-50"
                          : complete
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-zinc-200 bg-zinc-50"
                    }`}
                  >
                    {complete ? (
                      <span
                        className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm"
                        title="Post volledig"
                        aria-label="Post volledig"
                      >
                        <CheckIcon className="h-3 w-3" />
                      </span>
                    ) : null}
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium ${underfilled ? "text-red-900" : "text-zinc-900"}`}>
                        {day.label}
                      </p>
                      <label
                        className={`flex items-center gap-2 text-xs ${underfilled ? "text-red-800" : "text-zinc-500"}`}
                      >
                        Nodig
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={needed ?? ""}
                          onChange={(event) => setNeed(column.kind, day.id, parseNeed(event.target.value))}
                          placeholder="—"
                          className="w-14 rounded border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900"
                        />
                        <span>{formatFill(needed, people.length)}</span>
                      </label>
                    </div>

                    {ordered.length === 0 ? null : (
                      <ul className="space-y-1">
                        {ordered.map((user) => {
                          const isLead = user.id === responsibleId;

                          return (
                            <li key={user.id}>
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
                                className="flex w-full cursor-grab items-center justify-between gap-2 rounded bg-white px-2 py-1.5 text-left text-sm text-zinc-800 active:cursor-grabbing"
                                title={
                                  isLead
                                    ? "Verantwoordelijke. Sleep naar een andere dag."
                                    : "Sleep naar een andere dag."
                                }
                              >
                                <span className="min-w-0 truncate">{user.fullName || user.email}</span>
                                {isLead ? (
                                  <StarIcon className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                                ) : null}
                              </button>
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
    </div>
  );
}
