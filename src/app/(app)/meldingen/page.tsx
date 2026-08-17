"use client";

import { NotificationCard } from "@/components/notification-card";
import { PageHeader } from "@/components/page-header";
import { useNotifications } from "@/components/notifications-provider";

export default function MeldingenPage() {
  const { notifications, unreadCount, markAllRead } = useNotifications();

  return (
    <>
      <PageHeader
        title="Meldingen"
        description="Tekstmeldingen en andere updates."
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllRead}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Alles gelezen
            </button>
          ) : null
        }
      />

      <section className="space-y-2">
        {notifications.length === 0 ? (
          <p className="rounded-2xl border border-zinc-200 bg-white px-5 py-8 text-center text-sm text-zinc-500">
            Geen meldingen.
          </p>
        ) : (
          notifications.map((item) => <NotificationCard key={item.id} item={item} />)
        )}
      </section>
    </>
  );
}
