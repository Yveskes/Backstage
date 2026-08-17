"use client";

import { NotificationCard } from "@/components/notification-card";
import { useNotifications } from "@/components/notifications-provider";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function NotificationsButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasUnread = unreadCount > 0;

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const buttonClass = hasUnread
    ? variant === "dark"
      ? "bg-amber-400/15 text-amber-200 ring-1 ring-amber-400/40"
      : "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
    : variant === "dark"
      ? "bg-zinc-900 text-zinc-300 ring-1 ring-zinc-700 hover:text-white"
      : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:text-zinc-900";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`relative flex h-10 w-10 items-center justify-center rounded-full transition-colors ${buttonClass}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={hasUnread ? `Meldingen, ${unreadCount} nieuw` : "Meldingen"}
      >
        <BellIcon className="h-5 w-5" />
        {hasUnread ? (
          <span
            className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ${
              variant === "dark" ? "ring-zinc-950" : "ring-white"
            }`}
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Meldingen"
          className="absolute top-12 right-0 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">Meldingen</p>
            {hasUnread ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-zinc-500 hover:text-zinc-800"
              >
                Alles gelezen
              </button>
            ) : null}
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-500">Geen meldingen.</p>
            ) : (
              notifications.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  compact
                  onOpen={() => setOpen(false)}
                />
              ))
            )}
          </div>
          <div className="border-t border-zinc-200 bg-white px-4 py-2">
            <Link
              href="/meldingen"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Alle meldingen
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
