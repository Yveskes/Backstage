"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultThreads,
  emptyThread,
  mockNotifications,
  notificationPath,
  replyId,
  sanitizeThreads,
  toggleReactionList,
  setUserReaction,
  type AppNotification,
  type NotificationComment,
  type NotificationReply,
  type NotificationThread,
  type NotificationThreads,
} from "@/lib/notifications";
import { loadActivityEvents, saveActivityEvent } from "@/app/(app)/meldingen/activity-actions";
import {
  activityToNotification,
  memberJoinedActivity,
  mergeActivityEvents,
  sanitizeActivityEvents,
  type ActivityDraft,
  type ActivityEvent,
} from "@/lib/activity";
import { canAccessPath, canManageStaff, firstNameOf } from "@/lib/permissions";
import { useUsers } from "@/components/users-provider";
import { needsTshirt } from "@/lib/tshirts";
import { formatStaffTasks, isStaffTaskId, usersForTasks, type StaffTaskId } from "@/lib/staff-tasks";

const READ_KEY = "backstage.readNotificationIds";
const TASK_MESSAGES_KEY = "backstage.taskMessages";
const THREADS_KEY = "backstage.notificationThreads";
const SEEN_REPLIES_KEY = "backstage.seenReplyIds";
const ACTIVITY_KEY = "backstage.activityEvents";
const SEEN_MEMBERS_KEY = "backstage.seenMemberEmails";

export type TaskBroadcast = {
  id: string;
  taskIds: StaffTaskId[];
  title: string;
  body: string;
  fromName: string;
  fromUserId: string;
  recipientIds: string[];
  time: string;
};

function normalizeBroadcast(raw: Partial<TaskBroadcast> & { taskId?: StaffTaskId }): TaskBroadcast | null {
  const taskIds = Array.isArray(raw.taskIds)
    ? raw.taskIds.filter(isStaffTaskId)
    : raw.taskId && isStaffTaskId(raw.taskId)
      ? [raw.taskId]
      : [];

  if (!raw.id || taskIds.length === 0 || !Array.isArray(raw.recipientIds)) {
    return null;
  }

  return {
    id: raw.id,
    taskIds,
    title: raw.title ?? "",
    body: raw.body ?? "",
    fromName: raw.fromName ?? "",
    fromUserId: raw.fromUserId ?? "",
    recipientIds: raw.recipientIds,
    time: raw.time ?? "",
  };
}

type NotificationsContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  replies: NotificationReply[];
  unreadReplyCount: number;
  taskBroadcasts: TaskBroadcast[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  markRepliesRead: (ids?: string[]) => void;
  markThreadRepliesRead: (notificationId: string) => void;
  sendTaskBroadcast: (input: { taskIds: StaffTaskId[]; title: string; body: string }) => number;
  threadFor: (notificationId: string) => NotificationThread;
  addComment: (notificationId: string, body: string) => void;
  toggleReaction: (notificationId: string, emoji: string) => void;
  toggleCommentReaction: (notificationId: string, commentId: string, emoji: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { currentUser, users, usersReady, tshirtNotices, refreshDirectory } = useUsers();
  const [readIds, setReadIds] = useState<string[]>([]);
  const [seenReplyIds, setSeenReplyIds] = useState<string[]>([]);
  const [taskBroadcasts, setTaskBroadcasts] = useState<TaskBroadcast[]>([]);
  const [threads, setThreads] = useState<NotificationThreads>(defaultThreads);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(READ_KEY);
      setReadIds(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setReadIds([]);
    }

    try {
      const rawMessages = window.localStorage.getItem(TASK_MESSAGES_KEY);
      setTaskBroadcasts(
        rawMessages
          ? (JSON.parse(rawMessages) as Array<Partial<TaskBroadcast> & { taskId?: StaffTaskId }>)
              .map(normalizeBroadcast)
              .filter((item): item is TaskBroadcast => item !== null)
          : [],
      );
    } catch {
      setTaskBroadcasts([]);
    }

    try {
      const rawThreads = window.localStorage.getItem(THREADS_KEY);
      setThreads(rawThreads ? sanitizeThreads(JSON.parse(rawThreads)) : defaultThreads);
    } catch {
      setThreads(defaultThreads);
    }

    try {
      const rawSeen = window.localStorage.getItem(SEEN_REPLIES_KEY);
      setSeenReplyIds(rawSeen ? (JSON.parse(rawSeen) as string[]) : []);
    } catch {
      setSeenReplyIds([]);
    }

    try {
      const rawActivity = window.localStorage.getItem(ACTIVITY_KEY);
      setActivityEvents(rawActivity ? sanitizeActivityEvents(JSON.parse(rawActivity)) : []);
    } catch {
      setActivityEvents([]);
    }

    setReady(true);

    void loadActivityEvents()
      .then((remote) => {
        if (remote.length === 0) {
          return;
        }

        setActivityEvents((current) => mergeActivityEvents(current, remote));
      })
      .catch(() => {
        // Keep locally stored activity if the database table is not ready yet.
      });
  }, []);

  useEffect(() => {
    function refreshFeed() {
      void loadActivityEvents()
        .then((remote) => {
          if (remote.length === 0) {
            return;
          }

          setActivityEvents((current) => mergeActivityEvents(current, remote));
        })
        .catch(() => undefined);
      void refreshDirectory();
    }

    window.addEventListener("focus", refreshFeed);
    return () => window.removeEventListener("focus", refreshFeed);
  }, [refreshDirectory]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(READ_KEY, JSON.stringify(readIds));
    window.localStorage.setItem(SEEN_REPLIES_KEY, JSON.stringify(seenReplyIds));
    window.localStorage.setItem(TASK_MESSAGES_KEY, JSON.stringify(taskBroadcasts));
    window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
    window.localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activityEvents));
  }, [activityEvents, readIds, ready, seenReplyIds, taskBroadcasts, threads]);

  const markRead = useCallback((id: string) => {
    setReadIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  const recordActivity = useCallback((draft: ActivityDraft) => {
    setActivityEvents((current) => {
      if (current.some((event) => event.sourceId === draft.sourceId)) {
        return current;
      }

      const event: ActivityEvent = {
        id: draft.id ?? crypto.randomUUID(),
        createdAt: draft.createdAt ?? new Date().toISOString(),
        kind: draft.kind,
        actorId: draft.actorId,
        actorName: draft.actorName,
        title: draft.title,
        body: draft.body,
        href: draft.href,
        category: draft.category,
        sourceId: draft.sourceId,
        audience: draft.audience,
      };

      void saveActivityEvent(event);
      return mergeActivityEvents([event, ...current], []);
    });
  }, []);

  const sourceTitle = useCallback(
    (notificationId: string) =>
      mockNotifications.find((item) => item.id === notificationId)?.title ||
      taskBroadcasts.find((item) => item.id === notificationId)?.title ||
      activityEvents.find((item) => `activity-${item.id}` === notificationId)?.title ||
      "een melding",
    [activityEvents, taskBroadcasts],
  );

  useEffect(() => {
    if (!usersReady || !canManageStaff(currentUser)) {
      return;
    }

    const memberEmails = users
      .filter((user) => user.active !== false && !user.invitePending && user.email)
      .map((user) => user.email.toLowerCase());

    let seen: string[] | null = null;
    try {
      const raw = window.localStorage.getItem(SEEN_MEMBERS_KEY);
      seen = raw ? (JSON.parse(raw) as string[]) : null;
    } catch {
      seen = null;
    }

    if (!seen) {
      window.localStorage.setItem(SEEN_MEMBERS_KEY, JSON.stringify(memberEmails));
      return;
    }

    const newcomers = users.filter(
      (user) =>
        user.active !== false &&
        !user.invitePending &&
        user.email &&
        user.id !== currentUser.id &&
        !seen.includes(user.email.toLowerCase()),
    );

    for (const person of newcomers) {
      recordActivity(
        memberJoinedActivity({
          actorId: person.id,
          actorName: person.fullName || firstNameOf(person),
          email: person.email,
        }),
      );
    }

    window.localStorage.setItem(
      SEEN_MEMBERS_KEY,
      JSON.stringify([...new Set([...seen, ...memberEmails])]),
    );
  }, [currentUser, recordActivity, users, usersReady]);

  const addSeenReplyIds = useCallback((ids?: string[]) => {
    if (!ids || ids.length === 0) {
      return;
    }

    setSeenReplyIds((current) => {
      const next = new Set(current);
      for (const id of ids) {
        next.add(id);
      }
      return [...next];
    });
  }, []);

  const threadFor = useCallback(
    (notificationId: string) => threads[notificationId] ?? emptyThread(),
    [threads],
  );

  const addComment = useCallback(
    (notificationId: string, body: string) => {
      const text = body.trim();
      if (!text) {
        return;
      }

      const comment: NotificationComment = {
        id: `comment-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.fullName,
        body: text,
        time: "Zojuist",
        reactions: [],
      };

      setThreads((current) => {
        const thread = current[notificationId] ?? emptyThread();
        return {
          ...current,
          [notificationId]: {
            ...thread,
            comments: [...thread.comments, comment],
          },
        };
      });

      const name = firstNameOf(currentUser);
      const title = sourceTitle(notificationId);
      recordActivity({
        kind: "comment",
        actorId: currentUser.id,
        actorName: name,
        title: `${name} gaf commentaar`,
        body: `${name} schreef op “${title}”: ${text}`,
        href: notificationPath(notificationId),
        category: "medewerkers",
        sourceId: `comment:${notificationId}:${comment.id}`,
        audience: ["admin", "team"],
      });
    },
    [currentUser, recordActivity, sourceTitle],
  );

  const toggleReaction = useCallback(
    (notificationId: string, emoji: string) => {
      const thread = threads[notificationId] ?? emptyThread();
      const already = thread.reactions.some(
        (entry) => entry.emoji === emoji && entry.userIds.includes(currentUser.id),
      );

      setThreads((current) => {
        const currentThread = current[notificationId] ?? emptyThread();
        return {
          ...current,
          [notificationId]: {
            ...currentThread,
            reactions: setUserReaction(currentThread.reactions, emoji, currentUser.id),
          },
        };
      });

      if (!already) {
        const name = firstNameOf(currentUser);
        const title = sourceTitle(notificationId);
        recordActivity({
          kind: "reaction",
          actorId: currentUser.id,
          actorName: name,
          title: `${name} reageerde`,
          body: `${name} gaf ${emoji} op “${title}”.`,
          href: notificationPath(notificationId),
          category: "medewerkers",
          sourceId: `reaction:${notificationId}:${currentUser.id}:${emoji}`,
          audience: ["admin", "team"],
        });
      }
    },
    [currentUser, recordActivity, sourceTitle, threads],
  );

  const toggleCommentReaction = useCallback(
    (notificationId: string, commentId: string, emoji: string) => {
      const thread = threads[notificationId] ?? emptyThread();
      const comment = thread.comments.find((entry) => entry.id === commentId);
      const already = Boolean(
        comment?.reactions.some((entry) => entry.emoji === emoji && entry.userIds.includes(currentUser.id)),
      );

      setThreads((current) => {
        const currentThread = current[notificationId] ?? emptyThread();
        return {
          ...current,
          [notificationId]: {
            ...currentThread,
            comments: currentThread.comments.map((entry) =>
              entry.id === commentId
                ? { ...entry, reactions: toggleReactionList(entry.reactions, emoji, currentUser.id) }
                : entry,
            ),
          },
        };
      });

      if (!already && comment) {
        const name = firstNameOf(currentUser);
        recordActivity({
          kind: "reaction",
          actorId: currentUser.id,
          actorName: name,
          title: `${name} reageerde`,
          body: `${name} gaf ${emoji} op een reactie van ${comment.userName}.`,
          href: notificationPath(notificationId),
          category: "medewerkers",
          sourceId: `reaction:${notificationId}:${commentId}:${currentUser.id}:${emoji}`,
          audience: ["admin", "team"],
        });
      }
    },
    [currentUser, recordActivity, threads],
  );

  const sendTaskBroadcast = useCallback(
    (input: { taskIds: StaffTaskId[]; title: string; body: string }) => {
      const actor = currentUser;
      if (!canManageStaff(actor)) {
        return 0;
      }

      const taskIds = input.taskIds.filter(isStaffTaskId);
      const recipients = usersForTasks(users, taskIds);
      if (taskIds.length === 0 || recipients.length === 0) {
        return 0;
      }

      const taskLabel = formatStaffTasks(taskIds);
      const broadcast: TaskBroadcast = {
        id: `task-${taskIds.join("-")}-${Date.now()}`,
        taskIds,
        title: input.title.trim() || `Bericht voor ${taskLabel}`,
        body: input.body.trim(),
        fromName: currentUser.fullName,
        fromUserId: currentUser.id,
        recipientIds: recipients.map((user) => user.id),
        time: "Zojuist",
      };

      setTaskBroadcasts((current) => [broadcast, ...current].slice(0, 50));
      return recipients.length;
    },
    [currentUser, users],
  );

  const value = useMemo<NotificationsContextValue>(() => {
    const pending = users.filter((user) => needsTshirt(user.kind) && !user.tshirtConfirmed);
    const extra: AppNotification[] = [];

    if (canManageStaff(currentUser) && pending.length > 0) {
      extra.push({
        id: `tshirt-pending-${pending.length}`,
        title: "T-shirt nog niet bevestigd",
        body: `${pending.length} medewerker${pending.length === 1 ? " heeft" : "s hebben"} de t-shirtmaat nog niet gekozen of bevestigd.`,
        time: "Openstaand",
        unread: true,
        href: "/medewerkers/tshirts",
        kind: "tshirt",
        category: "medewerkers",
        important: true,
        audience: ["admin", "team"],
      });
    }

    if (canManageStaff(currentUser)) {
      for (const notice of tshirtNotices) {
        extra.push({
          id: notice.id,
          title: `${notice.fullName} bevestigde t-shirtmaat`,
          body: `${notice.fullName} koos maat ${notice.size}.`,
          time: notice.time,
          unread: !readIds.includes(notice.id),
          href: "/medewerkers/tshirts",
          kind: "tshirt",
          category: "medewerkers",
          audience: ["admin", "team"],
        });
      }
    }

    const taskNotifications: AppNotification[] = taskBroadcasts
      .filter(
        (item) =>
          item.recipientIds.includes(currentUser.id) || item.fromUserId === currentUser.id,
      )
      .map((item) => {
        const taskLabel = formatStaffTasks(item.taskIds);
        const isRecipient = item.recipientIds.includes(currentUser.id);

        return {
          id: item.id,
          title: item.title,
          body: `${item.body}\n\n${taskLabel} · van ${item.fromName}`,
          time: item.time,
          unread: isRecipient && !readIds.includes(item.id),
          kind: "task" as const,
          category: "medewerkers" as const,
          recipientIds: item.recipientIds,
          fromUserId: item.fromUserId,
          taskIds: item.taskIds,
        };
      });

    const activityNotifications = activityEvents
      .filter((event) => event.actorId !== currentUser.id)
      .map((event) => activityToNotification(event, readIds));

    const notifications = [
      ...activityNotifications,
      ...taskNotifications,
      ...extra,
      ...mockNotifications.map((item) => ({
        ...item,
        unread: item.unread && !readIds.includes(item.id),
      })),
    ].filter((item) => {
      if (item.kind === "tshirt" && !canManageStaff(currentUser)) {
        return false;
      }

      if (item.recipientIds && item.fromUserId !== currentUser.id && !item.recipientIds.includes(currentUser.id)) {
        return false;
      }

      if (item.audience && !item.audience.includes(currentUser.kind)) {
        return false;
      }

      if (item.kind === "activity") {
        return true;
      }

      return !item.href || item.href.startsWith("#") || canAccessPath(currentUser, item.href);
    });

    const replies: NotificationReply[] = notifications
      .flatMap((item) => {
        const comments = (threads[item.id] ?? emptyThread()).comments;
        return comments
          .filter((comment) => comment.userId !== currentUser.id)
          .map((comment) => ({
            id: replyId(item.id, comment.id),
            notificationId: item.id,
            notificationTitle: item.title,
            userName: comment.userName,
            body: comment.body,
            time: comment.time,
            unread: !seenReplyIds.includes(replyId(item.id, comment.id)),
          }));
      })
      .reverse();

    return {
      notifications,
      unreadCount: notifications.filter((item) => item.unread).length,
      replies,
      unreadReplyCount: replies.filter((item) => !seenReplyIds.includes(item.id)).length,
      taskBroadcasts,
      markRead,
      markAllRead() {
        setReadIds(notifications.map((item) => item.id));
      },
      markRepliesRead(ids) {
        addSeenReplyIds(ids ?? replies.map((item) => item.id));
      },
      markThreadRepliesRead(notificationId) {
        const comments = (threads[notificationId] ?? emptyThread()).comments;
        addSeenReplyIds(comments.map((comment) => replyId(notificationId, comment.id)));
      },
      sendTaskBroadcast,
      threadFor,
      addComment,
      toggleReaction,
      toggleCommentReaction,
    };
  }, [
    activityEvents,
    addComment,
    addSeenReplyIds,
    currentUser,
    markRead,
    readIds,
    seenReplyIds,
    sendTaskBroadcast,
    taskBroadcasts,
    threadFor,
    threads,
    toggleCommentReaction,
    toggleReaction,
    tshirtNotices,
    users,
  ]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}
