"use client";

import { CheckIcon, PencilIcon, StarIcon } from "@/components/icons";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import { canManageStaff, type AppUser } from "@/lib/permissions";
import { formatFill, isPostComplete, isPostUnderfilled } from "@/lib/staff-planning";
import {
  isFestivalTask,
  planningDayOptions,
  postsForDay,
  staffDayOptions,
  worksOnDay,
  type FestivalPost,
  type PlanningDayId,
  type StaffDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";

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
  const { users, updateUser, currentUser } = useUsers();
  const { planning, posts, setNeed, addPost, updatePost } = useStaffPlanning();
  const canManage = canManageStaff(currentUser);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      {canManage ? <NewPostForm onAdd={addPost} /> : null}
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
              {postsForDay(posts, day.id).map((task) => {
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
                      <div className="flex min-w-0 items-center gap-1">
                        <p className={`truncate text-sm font-medium ${underfilled ? "text-red-900" : "text-zinc-900"}`}>
                          {task.label}
                        </p>
                        {canManage ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setEditingId((current) => (current === task.id ? null : task.id));
                            }}
                            className="rounded p-1 text-zinc-400 hover:bg-white hover:text-zinc-800"
                            aria-label={`${task.label} bewerken`}
                            title="Post bewerken"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
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

                    {editingId === task.id && (task.days === day.id || (task.days === "both" && day.id === "friday")) ? (
                      <PostEditor
                        post={task}
                        onSave={(patch) => {
                          const result = updatePost(task.id, patch);
                          if (!result.error) {
                            setEditingId(null);
                          }
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : null}

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

function DayChoice({
  value,
  onChange,
}: {
  value: StaffDayId;
  onChange: (value: StaffDayId) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {staffDayOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`rounded-full px-2.5 py-1 text-xs ${
            value === option.id ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white text-zinc-700"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function NewPostForm({
  onAdd,
}: {
  onAdd: (input: { label: string; days: StaffDayId }) => FestivalPost | { error: string };
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [days, setDays] = useState<StaffDayId>("both");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = onAdd({ label, days });
    if ("error" in result) {
      setError(result.error);
      return;
    }

    setLabel("");
    setDays("both");
    setError(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
      >
        Nieuwe post
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-sm font-medium text-zinc-900">Nieuwe post</p>
      <p className="mt-1 text-xs text-zinc-500">Naam plus of de post op vrijdag, zaterdag of beide dagen staat.</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block min-w-0 flex-1 text-sm">
          <span className="font-medium text-zinc-700">Naam</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="bv. Parking"
            autoFocus
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </label>
        <div className="sm:pb-0.5">
          <p className="text-sm font-medium text-zinc-700">Dag</p>
          <div className="mt-1">
            <DayChoice value={days} onChange={setDays} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white">
            Toevoegen
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
            }}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-700"
          >
            Annuleren
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-red-800">{error}</p> : null}
    </form>
  );
}

function PostEditor({
  post,
  onSave,
  onCancel,
}: {
  post: FestivalPost;
  onSave: (patch: { label: string; days: StaffDayId }) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(post.label);
  const [days, setDays] = useState<StaffDayId>(post.days);

  return (
    <form
      className="mb-3 rounded-lg border border-zinc-200 bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ label, days });
      }}
    >
      <input
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        className="w-full rounded border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
      />
      <div className="mt-2">
        <DayChoice value={days} onChange={setDays} />
      </div>
      <div className="mt-2 flex gap-2">
        <button type="submit" className="rounded bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
          Opslaan
        </button>
        <button type="button" onClick={onCancel} className="rounded px-2.5 py-1 text-xs text-zinc-600">
          Annuleren
        </button>
      </div>
    </form>
  );
}
