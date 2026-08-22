"use client";

import { PageHeader } from "@/components/page-header";
import { useNotifications } from "@/components/notifications-provider";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import { canManageStaff, firstNameOf } from "@/lib/permissions";
import { pillClass } from "@/lib/pills";
import {
  formatStaffTasks,
  staffTaskOptionsFor,
  usersForTask,
  usersForTasks,
  type StaffTaskId,
} from "@/lib/staff-tasks";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function TaskBroadcastPage() {
  const { users, currentUser } = useUsers();
  const { posts } = useStaffPlanning();
  const taskOptions = staffTaskOptionsFor(posts);
  const { sendTaskBroadcast, taskBroadcasts } = useNotifications();
  const canManage = canManageStaff(currentUser);
  const [taskIds, setTaskIds] = useState<StaffTaskId[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-6 py-16 text-center">
        <p className="text-sm text-zinc-500">Geen toegang om berichten per taak te sturen.</p>
      </div>
    );
  }

  const recipients = usersForTasks(users, taskIds);
  const taskLabel = formatStaffTasks(taskIds);

  function toggleTask(taskId: StaffTaskId) {
    setFeedback(null);
    setTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId],
    );
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (taskIds.length === 0 || !body.trim()) {
      setFeedback("Kies minstens één taak en schrijf een bericht.");
      return;
    }

    const count = sendTaskBroadcast({ taskIds, title, body });
    if (count === 0) {
      setFeedback("Niemand heeft deze taken. Het bericht is niet verstuurd.");
      return;
    }

    setFeedback(`Verstuurd naar ${count} ${count === 1 ? "persoon" : "mensen"} op ${taskLabel}.`);
    setTitle("");
    setBody("");
  }

  return (
    <>
      <p className="text-sm text-zinc-500">
        <Link href="/medewerkers" className="hover:text-zinc-800">
          Medewerkers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-800">Bericht per taak</span>
      </p>

      <PageHeader
        title="Bericht per taak"
        description="Stel een melding op en stuur die naar iedereen op de gekozen taken, bijvoorbeeld opbouw en afbouw."
      />

      <form onSubmit={submit} className="mb-10 rounded-2xl border border-zinc-200 bg-white p-6">
        <fieldset>
          <legend className="text-sm font-medium text-zinc-800">Taken</legend>
          <p className="mt-1 text-sm text-zinc-500">Je kunt meerdere taken aanduiden.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {taskOptions.map((task) => {
              const selected = taskIds.includes(task.id);
              const count = usersForTask(users, task.id).length;

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={pillClass(selected)}
                >
                  {task.label}
                  <span className={`ml-1 text-[11px] ${selected ? "text-emerald-800" : "text-zinc-400"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {taskIds.length > 0 ? (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Ontvangers · {recipients.length}
            </p>
            {recipients.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-600">Nog niemand heeft deze taken.</p>
            ) : (
              <p className="mt-1 text-sm text-zinc-700">
                {recipients.map((user) => firstNameOf(user)).join(", ")}
              </p>
            )}
          </div>
        ) : null}

        <label className="mt-4 block text-sm font-medium text-zinc-800">
          Titel
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={taskLabel ? `Update voor ${taskLabel}` : "Korte titel"}
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-zinc-800">
          Bericht
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            required
            rows={5}
            placeholder="Schrijf hier het bericht voor deze ploeg…"
            className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </label>

        {feedback ? (
          <p
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              feedback.startsWith("Verstuurd")
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {feedback}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={taskIds.length === 0 || recipients.length === 0 || !body.trim()}
          className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Versturen
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Verzonden
        </h2>
        {taskBroadcasts.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500">
            Nog geen berichten per taak verstuurd.
          </p>
        ) : (
          <div className="space-y-3">
            {taskBroadcasts.map((item) => (
              <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                      {formatStaffTasks(item.taskIds)} · {item.recipientIds.length} ontvangers
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-zinc-900">{item.title}</h3>
                  </div>
                  <p className="shrink-0 text-xs text-zinc-500">{item.time}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{item.body}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
