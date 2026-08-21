"use server";

import {
  appDataKeys,
  fetchAppDataPayload,
  upsertAppDataPayload,
  type AppDataKey,
} from "@/lib/app-data-store";
import { createSessionClient } from "@/lib/supabase/session";

async function requireLogin() {
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return Boolean(user);
}

export async function loadAppData<T>(key: AppDataKey): Promise<T | null> {
  if (!(await requireLogin())) {
    return null;
  }

  return fetchAppDataPayload<T>(key);
}

export async function saveAppData(key: AppDataKey, payload: unknown): Promise<{ error?: string }> {
  if (!(await requireLogin())) {
    return { error: "Je moet ingelogd zijn om op te slaan." };
  }

  return upsertAppDataPayload(key, payload);
}

export { appDataKeys };
