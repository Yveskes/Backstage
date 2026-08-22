"use client";

import { CheckIcon, GripIcon, PencilIcon, StarIcon } from "@/components/icons";
import { useRef, useState, type DragEvent, type FormEvent } from "react";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import { canManageStaff, type AppUser } from "@/lib/permissions";
import { pillClass } from "@/lib/pills";
import { formatFill, isPostComplete, isPostUnderfilled } from "@/lib/staff-planning";
import {
  assignFestivalPostDay,
  daysFromFestivalByDay,
  festivalSchedulePatch,
  isFestivalTask,
  planningDayOptions,
  postsForDay,
  staffDayOptions,
  worksFestivalPostOnDay,
  type FestivalPost,
  type PlanningDayId,
  type StaffDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";

type PersonDragPayload = {
  kind: "person";
  userId: string;
  fromTask: StaffTaskId;
  fromDay: PlanningDayId;
};

type PostDragPayload = {
  kind: "post";
  postId: string;
  fromDay: PlanningDayId;
};

type UnassignedDragPayload = {
  kind: "unassigned";
  userId: string;
};

type DragPayload = PersonDragPayload | PostDragPayload | UnassignedDragPayload;

function byName(a: AppUser, b: AppUser) {
  return a.fullName.localeCompare(b.fullName, "nl");
}

function peopleForCell(users: AppUser[], taskId: StaffTaskId, day: PlanningDayId) {
  return users.filter((user) => worksFestivalPostOnDay(user.festivalByDay ?? {}, taskId, day));
}

function parseNeed(raw: string) {
  const trimmed = raw.trim();
  const parsed = trimmed === "" ? null : Number(trimmed);
  return parsed === null || !Number.isFinite(parsed) || parsed < 0 ? null : Math.round(parsed);
}

export function FestivalPlanning() {
  const { planning, posts, setNeed, updatePost, movePost, deletePost } = useStaffPlanning();
  const { users, updateUser, currentUser, removeTaskFromAll } = useUsers();
  const canManage = canManageStaff(currentUser);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragKind = useRef<"person" | "post" | "unassigned" | null>(null);
  const postDrag = useRef<PostDragPayload | null>(null);

  function removePost(post: FestivalPost) {
    const confirmed = window.confirm(
      `${post.label} verwijderen? Mensen op deze post raken die toewijzing kwijt.`,
    );
    if (!confirmed) {
      return;
    }

    deletePost(post.id);
    removeTaskFromAll(post.id);
    setEditingId((current) => (current === post.id ? null : current));
  }

  const unassigned = users
    .filter((user) => user.tasks.some((task) => isFestivalTask(task)) && !daysFromFestivalByDay(user.festivalByDay ?? {}))
    .sort(byName);

  function movePerson(payload: PersonDragPayload, toTask: StaffTaskId, toDay: PlanningDayId) {
    if (payload.fromTask === toTask && payload.fromDay === toDay) {
      return;
    }

    const user = users.find((entry) => entry.id === payload.userId);
    if (!user) {
      return;
    }

    const byDay = { ...user.festivalByDay };
    if (byDay[payload.fromDay] === payload.fromTask) {
      delete byDay[payload.fromDay];
    }
    byDay[toDay] = toTask;
    updateUser(user.id, festivalSchedulePatch(user.tasks, byDay, user.opbouwDays));
  }

  function assignUnassigned(userId: string, toTask: StaffTaskId, toDay: PlanningDayId) {
    const user = users.find((entry) => entry.id === userId);
    if (!user) {
      return;
    }

    const byDay = assignFestivalPostDay(user.festivalByDay ?? {}, toTask, toDay);
    updateUser(user.id, festivalSchedulePatch(user.tasks, byDay, user.opbouwDays));
  }

  function readPayload(event: DragEvent): (DragPayload & { unassigned?: boolean; userId?: string }) | null {
    if (dragKind.current === "post" && postDrag.current) {
      return postDrag.current;
    }

    try {
      const raw =
        event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");
      if (!raw || !raw.startsWith("{")) {
        return null;
      }

      return JSON.parse(raw) as DragPayload & { unassigned?: boolean; userId?: string };
    } catch {
      return null;
    }
  }

  function onDropCell(event: DragEvent, toTask: StaffTaskId, toDay: PlanningDayId) {
    event.preventDefault();
    event.stopPropagation();
    setOverKey(null);

    const payload = readPayload(event);
    if (!payload) {
      return;
    }

    if (payload.kind === "post" && payload.postId) {
      if (payload.fromDay !== toDay) {
        return;
      }

      const dayPosts = postsForDay(posts, toDay);
      const fromIndex = dayPosts.findIndex((post) => post.id === payload.postId);
      const toIndex = dayPosts.findIndex((post) => post.id === toTask);
      if (fromIndex < 0 || toIndex < 0) {
        return;
      }

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const after = event.clientY > rect.top + rect.height / 2;
      let insertIndex = after ? toIndex + 1 : toIndex;
      if (fromIndex < insertIndex) {
        insertIndex -= 1;
      }

      const without = dayPosts.filter((post) => post.id !== payload.postId);
      movePost(payload.postId, payload.fromDay, toDay, without[insertIndex]?.id ?? null);
      return;
    }

    if (payload.kind === "unassigned" || payload.unassigned) {
      if (payload.userId) {
        assignUnassigned(payload.userId, toTask, toDay);
      }
      return;
    }

    if (!payload.userId || payload.kind === "post") {
      return;
    }

    movePerson(payload, toTask, toDay);
  }

  function onDropDay(event: DragEvent, toDay: PlanningDayId) {
    event.preventDefault();
    setOverKey(null);

    const payload = readPayload(event);
    if (payload?.kind !== "post" || payload.fromDay !== toDay) {
      return;
    }

    movePost(payload.postId, payload.fromDay, toDay, null);
  }

  function startPostDrag(event: DragEvent, postId: string, fromDay: PlanningDayId) {
    const target = event.target as HTMLElement;
    if (target.closest("input, textarea")) {
      event.preventDefault();
      return;
    }

    if (target.closest("button, [data-person-drag]")) {
      return;
    }

    const payload: PostDragPayload = { kind: "post", postId, fromDay };
    dragKind.current = "post";
    postDrag.current = payload;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(payload));
    event.dataTransfer.setData("application/json", JSON.stringify(payload));
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
                    dragKind.current = "unassigned";
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({ kind: "unassigned", userId: user.id } satisfies UnassignedDragPayload),
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
            <div
              className={`mt-3 min-h-16 space-y-3 rounded-xl p-1 ${
                overKey === `day:${day.id}` ? "bg-zinc-100" : ""
              }`}
              onDragOver={(event) => {
                if (dragKind.current !== "post" || postDrag.current?.fromDay !== day.id) {
                  return;
                }
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setOverKey(`day:${day.id}`);
              }}
              onDragLeave={() => {
                setOverKey((current) => (current === `day:${day.id}` ? null : current));
              }}
              onDrop={(event) => onDropDay(event, day.id)}
            >
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
                    draggable={canManage}
                    onDragStart={(event) => startPostDrag(event, task.id, day.id)}
                    onDragEnd={() => {
                      dragKind.current = null;
                      postDrag.current = null;
                      setOverKey(null);
                    }}
                    onDragOver={(event) => {
                      if (dragKind.current === "post" && postDrag.current?.fromDay !== day.id) {
                        return;
                      }
                      event.preventDefault();
                      event.stopPropagation();
                      event.dataTransfer.dropEffect = "move";
                      setOverKey(dropKey);
                    }}
                    onDragLeave={() => {
                      setOverKey((current) => (current === dropKey ? null : current));
                    }}
                    onDrop={(event) => onDropCell(event, task.id, day.id)}
                    className={`relative rounded border px-3 py-3 ${
                      canManage ? "cursor-grab active:cursor-grabbing" : ""
                    } ${
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
                        {canManage ? (
                          <GripIcon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        ) : null}
                        {canManage ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setEditingId((current) => (current === task.id ? null : task.id));
                            }}
                            className={`truncate text-left text-sm font-medium hover:underline ${
                              underfilled ? "text-red-900" : "text-zinc-900"
                            }`}
                          >
                            {task.label}
                          </button>
                        ) : (
                          <p
                            className={`truncate text-sm font-medium ${
                              underfilled ? "text-red-900" : "text-zinc-900"
                            }`}
                          >
                            {task.label}
                          </p>
                        )}
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
                        onDelete={() => removePost(task)}
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
                                data-person-drag
                                draggable
                                onDragStart={(event) => {
                                  event.stopPropagation();
                                  dragKind.current = "person";
                                  postDrag.current = null;
                                  event.dataTransfer.effectAllowed = "move";
                                  event.dataTransfer.setData(
                                    "text/plain",
                                    user.id,
                                  );
                                  event.dataTransfer.setData(
                                    "application/json",
                                    JSON.stringify({
                                      kind: "person",
                                      userId: user.id,
                                      fromTask: task.id,
                                      fromDay: day.id,
                                    } satisfies PersonDragPayload),
                                  );
                                }}
                                onDragEnd={() => {
                                  dragKind.current = null;
                                  setOverKey(null);
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
          className={pillClass(value === option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function NewPostForm({
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
        className="rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
      >
        Nieuwe post
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="basis-full rounded-xl border border-zinc-200 bg-white p-4">
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
  onDelete,
}: {
  post: FestivalPost;
  onSave: (patch: { label: string; days: StaffDayId }) => void;
  onCancel: () => void;
  onDelete: () => void;
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
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <button type="submit" className="rounded bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
            Opslaan
          </button>
          <button type="button" onClick={onCancel} className="rounded px-2.5 py-1 text-xs text-zinc-600">
            Annuleren
          </button>
        </div>
        <button type="button" onClick={onDelete} className="rounded px-2.5 py-1 text-xs text-red-700 hover:bg-red-50">
          Verwijderen
        </button>
      </div>
    </form>
  );
}
