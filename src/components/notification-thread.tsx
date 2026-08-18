"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { CommentBubbleIcon, ThumbIcon } from "@/components/icons";
import { useUsers } from "@/components/users-provider";
import { useNotifications } from "@/components/notifications-provider";
import {
  notificationPath,
  reactionEmojis,
  type NotificationComment,
  type NotificationReaction,
} from "@/lib/notifications";

const reactionLabel: Record<string, string> = {
  "👍": "Vind ik leuk",
  "❤️": "Geweldig",
  "😂": "Haha",
  "🎉": "Feest",
  "👀": "Gekeken",
  "🙏": "Bedankt",
  "😮": "Wow",
};

function ReactionPicker({ onPick }: { onPick: (emoji: string) => void }) {
  return (
    <div className="flex items-center gap-0.5 rounded-full border border-zinc-200 bg-zinc-100 px-1 py-1 shadow-md">
      {reactionEmojis.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onPick(emoji)}
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-[22px] leading-none transition-transform hover:scale-125"
          aria-label={reactionLabel[emoji] ?? emoji}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function nameForUser(userId: string, users: { id: string; fullName: string }[]) {
  return users.find((user) => user.id === userId)?.fullName ?? "Iemand";
}

function WhoReactedTooltip({ reactions }: { reactions: NotificationReaction[] }) {
  const { users } = useUsers();
  const lines = reactions
    .filter((reaction) => reaction.userIds.length > 0)
    .map((reaction) => ({
      emoji: reaction.emoji,
      names: reaction.userIds.map((id) => nameForUser(id, users)),
    }));

  if (lines.length === 0) {
    return null;
  }

  return (
    <div
      role="tooltip"
      className="pointer-events-none invisible absolute bottom-full left-0 z-30 mb-1.5 w-max max-w-[16rem] rounded border border-zinc-200 bg-white px-2.5 py-2 opacity-0 shadow-md group-hover/who:visible group-hover/who:opacity-100 group-focus-within/who:visible group-focus-within/who:opacity-100"
    >
      <ul className="space-y-1">
        {lines.map((line) => (
          <li key={line.emoji} className="flex items-start gap-1.5 text-xs leading-4 text-zinc-800">
            <span>{line.emoji}</span>
            <span>{line.names.join(", ")}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReactionSummary({ reactions }: { reactions: NotificationReaction[] }) {
  const shown = reactions.slice(0, 3);

  if (shown.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center">
      {shown.map((reaction, index) => (
        <span
          key={reaction.emoji}
          className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-[11px] leading-none ring-2 ring-zinc-50"
          style={{ marginLeft: index === 0 ? 0 : -6 }}
        >
          {reaction.emoji}
        </span>
      ))}
    </div>
  );
}

export function NotificationActions({
  notificationId,
  compact = false,
  onComment,
}: {
  notificationId: string;
  compact?: boolean;
  onComment?: () => void;
}) {
  const { currentUser } = useUsers();
  const { threadFor, toggleReaction, markRead } = useNotifications();
  const thread = threadFor(notificationId);
  const myReaction = thread.reactions.find((entry) => entry.userIds.includes(currentUser.id))?.emoji;
  const likeCount = thread.reactions.reduce((sum, entry) => sum + entry.userIds.length, 0);
  const commentCount = thread.comments.length;
  const [picking, setPicking] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number>(0);
  const hoverTimer = useRef<number>(0);
  const openedByHold = useRef(false);

  function clearTimers() {
    window.clearTimeout(holdTimer.current);
    window.clearTimeout(hoverTimer.current);
  }

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (!picking) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setPicking(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [picking]);

  function openPicker() {
    openedByHold.current = true;
    setPicking(true);
  }

  function onLikePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "touch") {
      holdTimer.current = window.setTimeout(openPicker, 400);
    }
  }

  function onLikePointerUp() {
    window.clearTimeout(holdTimer.current);
  }

  function onLikeClick() {
    if (openedByHold.current) {
      openedByHold.current = false;
      return;
    }

    toggleReaction(notificationId, myReaction ?? "👍");
    setPicking(false);
  }

  const commentButtonClass =
    "inline-flex items-center gap-1.5 rounded px-2 py-1.5 text-sm text-zinc-600 hover:bg-zinc-200/80";

  return (
    <div ref={pickerRef} className="relative mt-2 border-t border-zinc-200 pt-1">
      {picking ? (
        <div className="absolute bottom-full left-0 z-20 mb-2">
          <ReactionPicker
            onPick={(emoji) => {
              toggleReaction(notificationId, emoji);
              setPicking(false);
            }}
          />
        </div>
      ) : null}
      <div className="flex items-center gap-1">
        <div className="group/who relative flex items-center">
          <button
            type="button"
            onClick={onLikeClick}
            onPointerDown={onLikePointerDown}
            onPointerUp={onLikePointerUp}
            onPointerCancel={onLikePointerUp}
            onMouseEnter={() => {
              hoverTimer.current = window.setTimeout(() => setPicking(true), 450);
            }}
            onMouseLeave={() => {
              window.clearTimeout(hoverTimer.current);
            }}
            className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-sm hover:bg-zinc-200/80 ${
              myReaction ? "font-medium text-zinc-900" : "text-zinc-600"
            }`}
            aria-label={reactionLabel[myReaction ?? "👍"]}
          >
            <ThumbIcon className="h-4 w-4" filled={Boolean(myReaction)} />
            <span className="tabular-nums text-zinc-600">{likeCount}</span>
          </button>
          <ReactionSummary reactions={thread.reactions} />
          <WhoReactedTooltip reactions={thread.reactions} />
        </div>
        {onComment ? (
          <button type="button" onClick={onComment} className={commentButtonClass}>
            <CommentBubbleIcon className="h-4 w-4" />
            {compact ? (
              commentCount > 0 ? commentCount : null
            ) : (
              <>
                Reageren
                {commentCount > 0 ? <span className="text-zinc-500">{commentCount}</span> : null}
              </>
            )}
          </button>
        ) : (
          <Link
            href={`${notificationPath(notificationId)}#reacties`}
            onClick={() => markRead(notificationId)}
            className={commentButtonClass}
          >
            <CommentBubbleIcon className="h-4 w-4" />
            {compact ? (
              commentCount > 0 ? commentCount : null
            ) : (
              <>
                Reageren
                {commentCount > 0 ? <span className="text-zinc-500">{commentCount}</span> : null}
              </>
            )}
          </Link>
        )}
      </div>
    </div>
  );
}

function CommentCard({
  comment,
  onToggle,
}: {
  comment: NotificationComment;
  onToggle: (emoji: string) => void;
}) {
  const { currentUser } = useUsers();
  const liked = comment.reactions.some((entry) => entry.emoji === "👍" && entry.userIds.includes(currentUser.id));

  return (
    <article className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-900">{comment.userName}</p>
        <p className="text-xs text-zinc-500">{comment.time}</p>
      </div>
      <p className="mt-0.5 whitespace-pre-wrap text-sm leading-5 text-zinc-700">{comment.body}</p>
      <div className="mt-1 flex items-center gap-2">
        <div className="group/who relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle("👍")}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs hover:bg-zinc-200/80 ${
              liked ? "font-medium text-zinc-900" : "text-zinc-500"
            }`}
          >
            <ThumbIcon className="h-3.5 w-3.5" filled={liked} />
            <span className="tabular-nums">{comment.reactions.reduce((sum, entry) => sum + entry.userIds.length, 0)}</span>
          </button>
          <ReactionSummary reactions={comment.reactions} />
          <WhoReactedTooltip reactions={comment.reactions} />
        </div>
      </div>
    </article>
  );
}

export function NotificationThread({ notificationId }: { notificationId: string }) {
  const { currentUser } = useUsers();
  const { threadFor, addComment, toggleCommentReaction } = useNotifications();
  const thread = threadFor(notificationId);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (window.location.hash === "#reacties") {
      setComposing(true);
    }
  }, []);

  useEffect(() => {
    if (composing) {
      inputRef.current?.focus();
    }
  }, [composing]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) {
      return;
    }

    addComment(notificationId, body);
    setDraft("");
  }

  return (
    <section id="reacties" className="mt-6">
      <NotificationActions notificationId={notificationId} onComment={() => setComposing(true)} />

      {thread.comments.length > 0 ? (
        <div className="mt-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">Reacties</h2>
          <div className="space-y-2">
            {thread.comments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                onToggle={(emoji) => toggleCommentReaction(notificationId, comment.id, emoji)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {composing ? (
        <form onSubmit={submit} className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-3">
          <p className="mb-2 text-xs text-zinc-500">Commentaar als {currentUser.fullName}</p>
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            placeholder="Schrijf een reactie…"
            className="w-full resize-y rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 outline-none focus:border-zinc-400"
          />
          <div className="mt-2 flex justify-end">
            <button type="submit" className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
              Plaats commentaar
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
