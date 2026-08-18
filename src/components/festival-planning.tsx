"use client";

import { CheckIcon, StarIcon } from "@/components/icons";
import { useRef, useState, type DragEvent } from "react";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import { formatFill, isPostComplete, isPostUnderfilled } from "@/lib/staff-planning";
import {
  festivalTaskOptions,
  isFestivalTask,
  planningDayOptions,
  worksOnDay,
  type PlanningDayId,
  type StaffDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";
import type { AppUser } from "@/lib/permissions";

type DragPayload = {
  userId: string;
  fromTask: StaffTaskId;
  fromDay: PlanningDayId;
};

function byName(a: AppUser, b: AppUser) {
  return a.fullName.localeCompare(b.fullName, "nl");
}

function peopleForCell(users: AppUser[], taskId: StaffTaskId, day: PlanningDayId) {
  return users.filter((user) => user.tasks.includes(taskId) && worksOnDay(user.days, day));
}

function nextDays(current: StaffDayId | null, fromDay: PlanningDayId, toDay: PlanningDayId): StaffDayId {
  if (fromDay === toDay) {
    return current ?? toDay;
  }

  return toDay;
}

function nextTasks(tasks: StaffTaskId[], fromTask: StaffTaskId, toTask: StaffTaskId) {
  const withoutSource = tasks.filter((task) => task !== fromTask);
  if (withoutSource.includes(toTask)) {
    return withoutSource;
  }

  return [...withoutSource, toTask];
}

function parseNeed(raw: string) {
  const trimmed = raw.trim();
  const parsed = trimmed === "" ? null : Number(trimmed);
  return parsed === null || !Number.isFinite(parsed) || parsed < 0 ? null : Math.round(parsed);
}

export function FestivalPlanning() {
  const { users, updateUser } = useUsers();
  const { planning, setNeed } = useStaffPlanning();
  const [overKey, setOverKey] = useState<string | null>(null);
  const dragging = useRef(false);

  const unassigned = users
    .filter((user) => user.tasks.some((task) => isFestivalTask(task)) && !user.days)
    .sort(byName);

  function movePerson(payload: DragPayload, toTask: StaffTaskId, toDay: PlanningDayId) {
    if (payload.fromTask === toTask && payload.fromDay === toDay) {
      return;
    }

    const user = users.find((entry) => entry.id === payload.userId);
    if (!user) {
      return;
    }

    updateUser(user.id, {
      tasks: nextTasks(user.tasks, payload.fromTask, toTask),
      days: nextDays(user.days, payload.fromDay, toDay),
    });
  }

  function assignUnassigned(userId: string, toTask: StaffTaskId, toDay: PlanningDayId) {
    const user = users.find((entry) => entry.id === userId);
    if (!user) {
      return;
    }

    const withoutFestival = user.tasks.filter((task) => !isFestivalTask(task));
    updateUser(user.id, {
      tasks: [...withoutFestival, toTask],
      days: toDay,
    });
  }

  function onDropCell(event: DragEvent, toTask: StaffTaskId, toDay: PlanningDayId) {
    event.preventDefault();
    setOverKey(null);

    try {
      const raw = event.dataTransfer.getData("application/json");
      const payload = JSON.parse(raw) as DragPayload & { unassigned?: boolean };
      if (!payload.userId) {
        return;
      }

      if (payload.unassigned) {
        assignUnassigned(payload.userId, toTask, toDay);
        return;
      }

      movePerson(payload, toTask, toDay);
    } catch {
      return;
    }
  }

  return (
    <div className="space-y-4">
      {unassigned.length > 0 ? (
        <section className="rounded border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-900">Nog geen festivaldag</h2>
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
                      JSON.stringify({ userId: user.id, unassigned: true }),
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
        {planningDayOptions.map((day) => (
          <section key={day.id}>
            <h2 className="text-base font-semibold text-zinc-900">{day.label}</h2>
            <div className="mt-3 space-y-3">
              {festivalTaskOptions.map((task) => {
                const people = peopleForCell(users, task.id, day.id);
                const responsibleId = planning.responsible[task.id];
                const ordered = [
                  ...people.filter((user) => user.id === responsibleId),
                  ...people.filter((user) => user.id !== responsibleId).sort(byName),
                ];
                const needed = planning.needed[task.id]?.[day.id] ?? null;
                const underfilled = isPostUnderfilled(needed, people.length);
                const complete = isPostComplete(needed, people.length);
                const dropKey = `${day.id}:${task.id}`;

                return (
                  <div
                    key={task.id}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setOverKey(dropKey);
                    }}
                    onDragLeave={() => {
                      setOverKey((current) => (current === dropKey ? null : current));
                    }}
                    onDrop={(event) => onDropCell(event, task.id, day.id)}
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
                        {task.label}
                      </p>
                      <label className={`flex items-center gap-2 text-xs ${underfilled ? "text-red-800" : "text-zinc-500"}`}>
                        Nodig
                        <input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={needed ?? ""}
                          onChange={(event) => setNeed(task.id, day.id, parseNeed(event.target.value))}
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
                                      fromTask: task.id,
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
                                    ? "Verantwoordelijke. Sleep naar een andere post of dag."
                                    : "Sleep naar een andere post of dag."
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
