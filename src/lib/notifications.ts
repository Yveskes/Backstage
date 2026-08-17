import type { UserKind } from "@/lib/permissions";
import type { StaffTaskId } from "@/lib/staff-tasks";

export type NotificationKind = "sponsoring" | "general" | "tshirt" | "task";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  href?: string;
  kind: NotificationKind;
  audience?: UserKind[];
  recipientIds?: string[];
  fromUserId?: string;
  taskId?: StaffTaskId;
  taskIds?: StaffTaskId[];
};

export const notificationKindLabel: Record<NotificationKind, string> = {
  sponsoring: "Sponsoring",
  general: "Melding",
  tshirt: "T-shirt",
  task: "Taak",
};

export const mockNotifications: AppNotification[] = [
  {
    id: "note-an",
    title: "An Janssens",
    body: "Kan ik zaterdag extra op toog A? De shift is wat krap.",
    time: "Vandaag 11:04",
    unread: true,
    kind: "general",
    audience: ["admin", "team"],
  },
  {
    id: "note-degi",
    title: "Degi",
    body: "Opbouw vrijdag is rond. Afbouw zaterdag nog twee extra handen nodig.",
    time: "Vandaag 10:18",
    unread: true,
    kind: "general",
    audience: ["admin"],
  },
  {
    id: "sponsor-factuur",
    title: "Factuur Brouwerij Demo",
    body: "De sponsorfactuur is verstuurd en wacht op betaling.",
    time: "Vandaag 09:12",
    unread: true,
    href: "/sponsoring/brouwerij-demo/facturen",
    kind: "sponsoring",
    audience: ["admin", "team"],
  },
  {
    id: "sponsor-vrijkaarten",
    title: "Vrijkaarten Radio Centrum",
    body: "8 vrijkaarten voor de winactie zijn klaar om te bevestigen.",
    time: "Vandaag 08:40",
    unread: true,
    href: "/sponsoring/radio-centrum/vrijkaarten",
    kind: "sponsoring",
    audience: ["admin", "team"],
  },
  {
    id: "note-team",
    title: "Zeverrock team",
    body: "De briefing van vrijdag staat klaar. Check je shift.",
    time: "Vandaag 09:12",
    unread: true,
    kind: "general",
    audience: ["staff"],
  },
  {
    id: "sponsor-prospect",
    title: "Garage Vandenberghe",
    body: "Dit prospectpakket Brons is nog niet bevestigd.",
    time: "Gisteren",
    unread: false,
    href: "/sponsoring/lokaal-garage",
    kind: "sponsoring",
    audience: ["admin", "team"],
  },
];
