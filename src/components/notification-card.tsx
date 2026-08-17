"use client";

import Link from "next/link";
import { type AppNotification } from "@/lib/notifications";
import { useNotifications } from "@/components/notifications-provider";

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
  const className =
    item.kind === "tshirt" && item.id.startsWith("tshirt-pending")
      ? "border-red-200 bg-red-50"
      : item.unread
        ? "border-amber-200 bg-amber-50"
        : "border-zinc-200 bg-white";
  const padding = compact ? "px-3 py-2" : "px-3 py-2.5";
  const bodyClamp = compact ? "line-clamp-3" : "line-clamp-4";

  const content = (
    <div className="flex min-w-0 items-start gap-2">
      {item.unread ? (
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
      ) : (
        <span className="mt-1.5 h-1.5 w-1.5 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-zinc-900">{item.title}</h3>
          <p className="shrink-0 text-xs text-zinc-500">{item.time}</p>
        </div>
        <p className={`mt-0.5 whitespace-pre-wrap text-xs leading-5 text-zinc-600 ${bodyClamp}`}>
          {item.body.trim()}
        </p>
      </div>
    </div>
  );

  function handleOpen() {
    markRead(item.id);
    onOpen?.();
  }

  if (item.href) {
    return (
      <Link
        href={item.href}
        onClick={handleOpen}
        className={`block rounded border ${className} ${padding} transition-colors hover:border-zinc-300`}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      className={`rounded border ${className} ${padding} ${item.unread ? "cursor-pointer" : ""}`}
      onClick={() => {
        if (item.unread) {
          handleOpen();
        }
      }}
    >
      {content}
    </article>
  );
}
