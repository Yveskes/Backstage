"use server";

import { fetchActivityEvents, insertActivityEvent } from "@/lib/activity-store";
import type { ActivityDraft, ActivityEvent } from "@/lib/activity";

export async function loadActivityEvents(): Promise<ActivityEvent[]> {
  return fetchActivityEvents();
}

export async function saveActivityEvent(draft: ActivityDraft): Promise<ActivityEvent | null> {
  return insertActivityEvent(draft);
}
