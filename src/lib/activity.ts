import type { ModuleId, UserKind } from "@/lib/permissions";
import { moduleIds } from "@/lib/permissions";
import type { AppNotification } from "@/lib/notifications";

export const activityKinds = ["comment", "reaction", "member_joined"] as const;
export type ActivityKind = (typeof activityKinds)[number];

export type ActivityEvent = {
  id: string;
  kind: ActivityKind;
  actorId: string;
  actorName: string;
  title: string;
  body: string;
  href?: string;
  category: ModuleId;
  sourceId: string;
  audience: UserKind[];
  createdAt: string;
};

export type ActivityDraft = Omit<ActivityEvent, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
};

export function formatActivityTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Zojuist";
  }

  const diff = Date.now() - date.getTime();
  if (diff < 60_000) {
    return "Zojuist";
  }

  if (diff < 3_600_000) {
    return `${Math.max(1, Math.floor(diff / 60_000))} min. geleden`;
  }

  const sameDay = date.toDateString() === new Date().toDateString();
  const time = date.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) {
    return `Vandaag ${time}`;
  }

  return date.toLocaleString("nl-BE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function activityNotificationId(eventId: string) {
  return `activity-${eventId}`;
}

export function activityToNotification(event: ActivityEvent, readIds: string[]): AppNotification {
  const id = activityNotificationId(event.id);
  const notification: AppNotification = {
    id,
    title: event.title,
    body: event.body,
    time: formatActivityTime(event.createdAt),
    unread: !readIds.includes(id),
    kind: "activity",
    category: event.category,
    audience: event.audience,
    fromUserId: event.actorId,
  };

  if (event.href) {
    notification.href = event.href;
  }

  return notification;
}

function isActivityKind(value: unknown): value is ActivityKind {
  return activityKinds.includes(value as ActivityKind);
}

function isModuleId(value: unknown): value is ModuleId {
  return typeof value === "string" && (moduleIds as readonly string[]).includes(value);
}

export function sanitizeActivityEvents(raw: unknown): ActivityEvent[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const events: ActivityEvent[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const data = entry as Partial<ActivityEvent>;
    if (!data.id || !isActivityKind(data.kind) || !data.actorName || !data.title || !data.body || !data.sourceId) {
      continue;
    }

    const audience = Array.isArray(data.audience)
      ? data.audience.filter((item): item is UserKind => item === "admin" || item === "team" || item === "staff")
      : [];

    const event: ActivityEvent = {
      id: String(data.id),
      kind: data.kind,
      actorId: String(data.actorId ?? ""),
      actorName: String(data.actorName),
      title: String(data.title),
      body: String(data.body),
      category: isModuleId(data.category) ? data.category : "medewerkers",
      sourceId: String(data.sourceId),
      audience: audience.length > 0 ? audience : ["admin", "team"],
      createdAt: typeof data.createdAt === "string" ? data.createdAt : new Date().toISOString(),
    };

    if (typeof data.href === "string" && data.href) {
      event.href = data.href;
    }

    events.push(event);
  }

  return events;
}

export function memberJoinedActivity(input: {
  actorId: string;
  actorName: string;
  email: string;
}): ActivityDraft {
  return {
    kind: "member_joined",
    actorId: input.actorId,
    actorName: input.actorName,
    title: "Nieuw lid",
    body: `${input.actorName} is lid geworden van Backstage.`,
    href: "/medewerkers",
    category: "medewerkers",
    sourceId: `member:${input.email.toLowerCase()}`,
    audience: ["admin", "team"],
  };
}

export function mergeActivityEvents(local: ActivityEvent[], remote: ActivityEvent[]) {
  const byId = new Map<string, ActivityEvent>();
  const bySource = new Map<string, ActivityEvent>();

  for (const event of [...remote, ...local]) {
    if (byId.has(event.id) || bySource.has(event.sourceId)) {
      continue;
    }

    byId.set(event.id, event);
    bySource.set(event.sourceId, event);
  }

  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
