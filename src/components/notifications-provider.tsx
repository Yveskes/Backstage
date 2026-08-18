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
import { canAccessPath, canManageStaff } from "@/lib/permissions";
import { useUsers } from "@/components/users-provider";
import { needsTshirt } from "@/lib/tshirts";
import { formatStaffTasks, isStaffTaskId, usersForTasks, type StaffTaskId } from "@/lib/staff-tasks";

const READ_KEY = "backstage.readNotificationIds";
const TASK_MESSAGES_KEY = "backstage.taskMessages";
const THREADS_KEY = "backstage.notificationThreads";
const SEEN_REPLIES_KEY = "backstage.seenReplyIds";

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
  const { currentUser, users, tshirtNotices } = useUsers();
  const [readIds, setReadIds] = useState<string[]>([]);
  const [seenReplyIds, setSeenReplyIds] = useState<string[]>([]);
  const [taskBroadcasts, setTaskBroadcasts] = useState<TaskBroadcast[]>([]);
  const [threads, setThreads] = useState<NotificationThreads>(defaultThreads);
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

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(READ_KEY, JSON.stringify(readIds));
    window.localStorage.setItem(SEEN_REPLIES_KEY, JSON.stringify(seenReplyIds));
    window.localStorage.setItem(TASK_MESSAGES_KEY, JSON.stringify(taskBroadcasts));
    window.localStorage.setItem(THREADS_KEY, JSON.stringify(threads));
  }, [readIds, ready, seenReplyIds, taskBroadcasts, threads]);

  const markRead = useCallback((id: string) => {
    setReadIds((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

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
    },
    [currentUser],
  );

  const toggleReaction = useCallback(
    (notificationId: string, emoji: string) => {
      setThreads((current) => {
        const thread = current[notificationId] ?? emptyThread();
        return {
          ...current,
          [notificationId]: {
            ...thread,
            reactions: setUserReaction(thread.reactions, emoji, currentUser.id),
          },
        };
      });
    },
    [currentUser.id],
  );

  const toggleCommentReaction = useCallback(
    (notificationId: string, commentId: string, emoji: string) => {
      setThreads((current) => {
        const thread = current[notificationId] ?? emptyThread();
        return {
          ...current,
          [notificationId]: {
            ...thread,
            comments: thread.comments.map((comment) =>
              comment.id === commentId
                ? { ...comment, reactions: toggleReactionList(comment.reactions, emoji, currentUser.id) }
                : comment,
            ),
          },
        };
      });
    },
    [currentUser.id],
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

    const notifications = [
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
