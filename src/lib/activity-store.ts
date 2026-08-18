import { createAdminClient } from "@/lib/supabase/admin";
import {
  sanitizeActivityEvents,
  type ActivityDraft,
  type ActivityEvent,
} from "@/lib/activity";

function rowToEvent(row: Record<string, unknown>): ActivityEvent | null {
  return sanitizeActivityEvents([
    {
      id: row.id,
      kind: row.kind,
      actorId: row.actor_id,
      actorName: row.actor_name,
      title: row.title,
      body: row.body,
      href: row.href,
      category: row.category,
      sourceId: row.source_id,
      audience: row.audience,
      createdAt: row.created_at,
    },
  ])[0] ?? null;
}

export async function fetchActivityEvents(): Promise<ActivityEvent[]> {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from("activity_events")
    .select("id, kind, actor_id, actor_name, title, body, href, category, source_id, audience, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => rowToEvent(row as Record<string, unknown>))
    .filter((event): event is ActivityEvent => event !== null);
}

export async function insertActivityEvent(draft: ActivityDraft): Promise<ActivityEvent | null> {
  const event: ActivityEvent = {
    id: draft.id ?? crypto.randomUUID(),
    kind: draft.kind,
    actorId: draft.actorId,
    actorName: draft.actorName,
    title: draft.title,
    body: draft.body,
    href: draft.href,
    category: draft.category,
    sourceId: draft.sourceId,
    audience: draft.audience,
    createdAt: draft.createdAt ?? new Date().toISOString(),
  };

  const admin = createAdminClient();
  if (!admin) {
    return event;
  }

  const { error } = await admin.from("activity_events").upsert(
    {
      id: event.id,
      kind: event.kind,
      actor_id: event.actorId || null,
      actor_name: event.actorName,
      title: event.title,
      body: event.body,
      href: event.href ?? null,
      category: event.category,
      source_id: event.sourceId,
      audience: event.audience,
      created_at: event.createdAt,
    },
    { onConflict: "source_id" },
  );

  if (error) {
    return event;
  }

  return event;
}
