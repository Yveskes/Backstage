"use client";

import { NotificationList } from "@/components/notification-card";
import { PageHeader } from "@/components/page-header";
import { TshirtPicker } from "@/components/tshirt-picker";
import { useNotifications } from "@/components/notifications-provider";
import { useStaffPlanning } from "@/components/staff-planning-provider";
import { useUsers } from "@/components/users-provider";
import { firstNameOf } from "@/lib/permissions";
import { assignmentBlocks } from "@/lib/staff-tasks";

export function HomeFeed() {
  const { currentUser } = useUsers();
  const { notifications } = useNotifications();
  const { posts } = useStaffPlanning();
  const tasks = assignmentBlocks(currentUser, posts);

  return (
    <>
      <PageHeader
        title={`Hallo ${firstNameOf(currentUser)}`}
        description="Hier vind je alles: meldingen, reacties en wat er voor jou klaarstaat."
      />

      <TshirtPicker />

      {tasks.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">Jouw taken</h2>
          <div className="space-y-3">
            {tasks.map((task) => (
              <article key={task.id} className="rounded-2xl border border-zinc-200 bg-white px-5 py-4">
                <h3 className="text-sm font-semibold text-zinc-900">{task.title}</h3>
                {task.days.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {task.days.map((day) => (
                      <span
                        key={day}
                        className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-700"
                      >
                        {day}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">Nog geen dag ingepland</p>
                )}
                <dl className="mt-3 space-y-2 text-sm leading-6 text-zinc-600">
                  <div>
                    <dt className="font-medium text-zinc-800">Wanneer</dt>
                    <dd>{task.when}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-zinc-800">Taken</dt>
                    <dd>{task.tasks}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-zinc-900">Meldingen</h2>
        {notifications.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500">
            Geen meldingen.
          </p>
        ) : (
          <NotificationList items={notifications} />
        )}
      </section>
    </>
  );
}
