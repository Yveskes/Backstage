"use client";

import { CommentBubbleIcon } from "@/components/icons";
import { useNotifications } from "@/components/notifications-provider";
import { notificationPath } from "@/lib/notifications";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function RepliesButton({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { replies, unreadReplyCount, markRepliesRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasUnread = unreadReplyCount > 0;

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
      ? "bg-sky-400/15 text-sky-200 ring-1 ring-sky-400/40"
      : "bg-sky-50 text-sky-900 ring-1 ring-sky-200"
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
        aria-label={hasUnread ? `Reacties, ${unreadReplyCount} nieuw` : "Reacties"}
      >
        <CommentBubbleIcon className="h-5 w-5" />
        {hasUnread ? (
          <span
            className={`absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-sky-500 ring-2 ${
              variant === "dark" ? "ring-zinc-950" : "ring-white"
            }`}
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Reacties"
          className="absolute top-12 right-0 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">Reacties</p>
            {hasUnread ? (
              <button
                type="button"
                onClick={() => markRepliesRead()}
                className="text-xs text-zinc-500 hover:text-zinc-800"
              >
                Alles gelezen
              </button>
            ) : null}
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {replies.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-zinc-500">Nog geen reacties.</p>
            ) : (
              <ul className="space-y-1">
                {replies.map((reply) => (
                  <li key={reply.id}>
                    <Link
                      href={`${notificationPath(reply.notificationId)}#reacties`}
                      onClick={() => {
                        markRepliesRead([reply.id]);
                        setOpen(false);
                      }}
                      className="block rounded-xl px-3 py-2 hover:bg-white"
                    >
                      <div className="flex items-start gap-2">
                        {reply.unread ? (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                        ) : (
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="truncate text-sm font-semibold text-zinc-900">{reply.userName}</p>
                            <p className="shrink-0 text-xs text-zinc-500">{reply.time}</p>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-zinc-500">op {reply.notificationTitle}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-zinc-600">{reply.body}</p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
