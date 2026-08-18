"use client";

import { DashboardModules } from "@/components/dashboard-modules";
import { NotificationList } from "@/components/notification-card";
import { PageHeader } from "@/components/page-header";
import { TshirtPicker } from "@/components/tshirt-picker";
import { useNotifications } from "@/components/notifications-provider";
import { useUsers } from "@/components/users-provider";
import { firstNameOf } from "@/lib/permissions";
import { formatStaffTasks, formatUserSchedule } from "@/lib/staff-tasks";
import type { ConnectionTestResult } from "@/lib/supabase/test-connection";

const statusStyles: Record<string, string> = {
  ok: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rls_blocked: "border-amber-200 bg-amber-50 text-amber-800",
  migration_pending: "border-orange-200 bg-orange-50 text-orange-800",
  key_error: "border-red-200 bg-red-50 text-red-800",
  config_error: "border-red-200 bg-red-50 text-red-800",
  error: "border-red-200 bg-red-50 text-red-800",
};

export function HomeFeed({
  showModules = false,
  connection,
}: {
  showModules?: boolean;
  connection?: ConnectionTestResult;
}) {
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

      {shiftLabel ? (
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Jouw taak</p>
          <p className="mt-1 text-sm font-medium text-zinc-900">{shiftLabel}</p>
        </section>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Meldingen
        </h2>
        {notifications.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500">
            Geen meldingen.
          </p>
        ) : (
          <NotificationList items={notifications} />
        )}
      </section>

      {showModules ? (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Onderdelen
          </h2>
          <DashboardModules />
        </section>
      ) : null}

      {connection ? (
        <section
          className={`rounded-2xl border px-5 py-4 text-sm ${statusStyles[connection.status] ?? statusStyles.error}`}
        >
          <p className="font-medium">Supabase</p>
          <p className="mt-1">{connection.message}</p>
        </section>
      ) : null}
    </>
  );
}
