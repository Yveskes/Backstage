"use client";

import Link from "next/link";
import {
  fileAttachments,
  groupNotifications,
  imageAttachments,
  notificationPath,
  type AppNotification,
} from "@/lib/notifications";
import { useNotifications } from "@/components/notifications-provider";
import { NotificationActions } from "@/components/notification-thread";

export function NotificationCard({
  item,
  compact = false,
  onOpen,
}: {
  item: AppNotification;
  compact?: boolean;
  onOpen?: () => void;
}) {
  const { markRead } = useNotifications();
  const important = Boolean(item.important);
  const photos = imageAttachments(item);
  const files = fileAttachments(item);
  const visiblePhotos = photos.slice(0, compact ? 2 : 3);
  const extraPhotos = Math.max(0, photos.length - visiblePhotos.length);
  const dotClass = important ? "bg-red-500" : item.unread ? "bg-amber-500" : "";

  return (
    <article className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
      <Link
        href={notificationPath(item.id)}
        onClick={() => {
          markRead(item.id);
          onOpen?.();
        }}
        className="block"
      >
        <div className="flex min-w-0 items-start gap-2">
          {dotClass ? (
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`} aria-hidden="true" />
          ) : (
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0" aria-hidden="true" />
          )}
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold leading-5 text-zinc-900">{item.title}</h3>
              <p className="mt-0.5 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-zinc-600">
                {item.body.trim()}
              </p>
              {photos.length > 0 ? (
                <div className="mt-1.5 flex gap-1">
                  {visiblePhotos.map((photo) => (
                    <span
                      key={photo.id}
                      className="relative h-10 w-10 overflow-hidden rounded border border-zinc-200 bg-zinc-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    </span>
                  ))}
                  {extraPhotos > 0 ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-[11px] text-zinc-600">
                      +{extraPhotos}
                    </span>
                  ) : null}
                </div>
              ) : null}
              {files.length > 0 ? (
                <p className="mt-1 text-[11px] text-zinc-500">
                  {files.length} bijlage{files.length === 1 ? "" : "n"}
                </p>
              ) : null}
            </div>
            <p className="shrink-0 text-xs text-zinc-500">{item.time}</p>
          </div>
        </div>
      </Link>
      <NotificationActions notificationId={item.id} compact={compact} />
    </article>
  );
}

export function NotificationList({
  items,
  compact = false,
  onOpen,
}: {
  items: AppNotification[];
  compact?: boolean;
  onOpen?: () => void;
}) {
  const groups = groupNotifications(items);

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.category}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            {group.label}
          </h2>
          <div className="space-y-2">
            {group.items.map((item) => (
              <NotificationCard key={item.id} item={item} compact={compact} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
