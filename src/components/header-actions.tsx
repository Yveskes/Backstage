"use client";

import { NotificationsButton } from "@/components/notifications-button";
import { RepliesButton } from "@/components/replies-button";

export function HeaderActions({ variant = "light" }: { variant?: "light" | "dark" }) {
  return (
    <div className="flex items-center gap-2">
      <RepliesButton variant={variant} />
      <NotificationsButton variant={variant} />
    </div>
  );
}
