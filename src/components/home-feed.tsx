"use client";

import { ExpenseClaims } from "@/components/expense-claims";
import { NotificationList } from "@/components/notification-card";
import { PageHeader } from "@/components/page-header";
import { TshirtPicker } from "@/components/tshirt-picker";
import { useNotifications } from "@/components/notifications-provider";
import { useUsers } from "@/components/users-provider";
import { firstNameOf } from "@/lib/permissions";
import { formatStaffTasks, formatUserSchedule } from "@/lib/staff-tasks";

export function HomeFeed() {
  const { currentUser } = useUsers();
  const { notifications } = useNotifications();
  const shiftLabel =
    currentUser.tasks.length > 0
      ? `${formatStaffTasks(currentUser.tasks)} · ${formatUserSchedule(currentUser)}`
      : null;

  return (
    <>
      <PageHeader
        title={`Hallo ${firstNameOf(currentUser)}`}
        description="Hier vind je alles: meldingen, reacties en wat er voor jou klaarstaat."
      />

      <TshirtPicker />

      <ExpenseClaims />

      {shiftLabel ? (
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Jouw taak</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{shiftLabel}</p>
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
