import type { ModuleId, UserKind } from "@/lib/permissions";
import { moduleOptions } from "@/lib/permissions";
import type { StaffTaskId } from "@/lib/staff-tasks";

export type NotificationKind = "sponsoring" | "general" | "tshirt" | "task";
export type NotificationCategory = ModuleId;

export type NotificationAttachment = {
  id: string;
  name: string;
  type: "image" | "file";
  url: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  href?: string;
  kind: NotificationKind;
  category: NotificationCategory;
  important?: boolean;
  attachments?: NotificationAttachment[];
  audience?: UserKind[];
  recipientIds?: string[];
  fromUserId?: string;
  taskId?: StaffTaskId;
  taskIds?: StaffTaskId[];
};

export const notificationCategoryLabel: Record<NotificationCategory, string> = Object.fromEntries(
  moduleOptions.map((option) => [option.id, option.label]),
) as Record<NotificationCategory, string>;

export function categoryLabel(category: NotificationCategory) {
  return notificationCategoryLabel[category];
}

export function notificationPath(id: string) {
  return `/meldingen/${id}`;
}

export function replyId(notificationId: string, commentId: string) {
  return `${notificationId}:${commentId}`;
}

export type NotificationReply = {
  id: string;
  notificationId: string;
  notificationTitle: string;
  userName: string;
  body: string;
  time: string;
  unread: boolean;
};

export function imageAttachments(item: AppNotification) {
  return (item.attachments ?? []).filter((file) => file.type === "image");
}

export function fileAttachments(item: AppNotification) {
  return (item.attachments ?? []).filter((file) => file.type === "file");
}

export function groupNotifications(items: AppNotification[]) {
  return moduleOptions
    .map((option) => ({
      category: option.id,
      label: option.label,
      items: items.filter((item) => item.category === option.id),
    }))
    .filter((group) => group.items.length > 0);
}

export const reactionEmojis = ["👍", "❤️", "😂", "🎉", "👀", "🙏", "😮"] as const;

export type NotificationReaction = {
  emoji: string;
  userIds: string[];
};

export type NotificationComment = {
  id: string;
  userId: string;
  userName: string;
  body: string;
  time: string;
  reactions: NotificationReaction[];
};

export type NotificationThread = {
  reactions: NotificationReaction[];
  comments: NotificationComment[];
};

export type NotificationThreads = Record<string, NotificationThread>;

export function emptyThread(): NotificationThread {
  return { reactions: [], comments: [] };
}

export function toggleReactionList(
  reactions: NotificationReaction[],
  emoji: string,
  userId: string,
): NotificationReaction[] {
  const current = reactions.find((entry) => entry.emoji === emoji);
  if (!current) {
    return [...reactions, { emoji, userIds: [userId] }];
  }

  const hasReacted = current.userIds.includes(userId);
  const userIds = hasReacted
    ? current.userIds.filter((id) => id !== userId)
    : [...current.userIds, userId];

  if (userIds.length === 0) {
    return reactions.filter((entry) => entry.emoji !== emoji);
  }

  return reactions.map((entry) => (entry.emoji === emoji ? { ...entry, userIds } : entry));
}

export function setUserReaction(
  reactions: NotificationReaction[],
  emoji: string,
  userId: string,
): NotificationReaction[] {
  const already = reactions.some((entry) => entry.emoji === emoji && entry.userIds.includes(userId));
  const withoutUser = reactions
    .map((entry) => ({ ...entry, userIds: entry.userIds.filter((id) => id !== userId) }))
    .filter((entry) => entry.userIds.length > 0);

  if (already) {
    return withoutUser;
  }

  return toggleReactionList(withoutUser, emoji, userId);
}

function sanitizeReactions(value: unknown): NotificationReaction[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const data = entry as Partial<NotificationReaction>;
      if (typeof data.emoji !== "string" || !data.emoji || !Array.isArray(data.userIds)) {
        return null;
      }

      const userIds = data.userIds.filter((id): id is string => typeof id === "string" && id.length > 0);
      if (userIds.length === 0) {
        return null;
      }

      return { emoji: data.emoji, userIds };
    })
    .filter((entry): entry is NotificationReaction => entry !== null);
}

function sanitizeComments(value: unknown): NotificationComment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const data = entry as Partial<NotificationComment>;
      if (!data.id || !data.userId || typeof data.body !== "string" || !data.body.trim()) {
        return null;
      }

      return {
        id: String(data.id),
        userId: String(data.userId),
        userName: typeof data.userName === "string" ? data.userName : "Iemand",
        body: data.body,
        time: typeof data.time === "string" ? data.time : "",
        reactions: sanitizeReactions(data.reactions),
      };
    })
    .filter((entry): entry is NotificationComment => entry !== null);
}

export function sanitizeThreads(raw: unknown): NotificationThreads {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .map(([id, value]) => {
        if (!value || typeof value !== "object") {
          return null;
        }

        const data = value as Partial<NotificationThread>;
        return [
          id,
          {
            reactions: sanitizeReactions(data.reactions),
            comments: sanitizeComments(data.comments),
          },
        ] as const;
      })
      .filter((entry): entry is readonly [string, NotificationThread] => entry !== null),
  );
}

export const defaultThreads: NotificationThreads = {
  "note-degi": {
    reactions: [
      { emoji: "👍", userIds: ["yves", "lien"] },
      { emoji: "🙏", userIds: ["tom"] },
    ],
    comments: [
      {
        id: "c-degi-1",
        userId: "yves",
        userName: "Yves Moreel",
        body: "Ik kan tot 1u blijven. Wie neemt daarna over?",
        time: "Vandaag 10:32",
        reactions: [{ emoji: "👀", userIds: ["degi"] }],
      },
      {
        id: "c-degi-2",
        userId: "lien",
        userName: "Lien Peeters",
        body: "Ik kom extra voor de hekken 💪",
        time: "Vandaag 10:41",
        reactions: [{ emoji: "🎉", userIds: ["yves"] }],
      },
    ],
  },
  "social-lineup": {
    reactions: [{ emoji: "🎉", userIds: ["lien"] }],
    comments: [
      {
        id: "c-social-1",
        userId: "lien",
        userName: "Lien Peeters",
        body: "Poster is scherp genoeg voor stories. Ik zou de sfeerfoto als tweede slide zetten.",
        time: "Vandaag 12:18",
        reactions: [],
      },
    ],
  },
};

export const mockNotifications: AppNotification[] = [
  {
    id: "note-an",
    title: "An Janssens",
    body: "Kan ik zaterdag extra op toog A? De shift is wat krap.",
    time: "Vandaag 11:04",
    unread: true,
    kind: "general",
    category: "medewerkers",
    audience: ["admin", "team"],
  },
  {
    id: "note-degi",
    title: "Degi",
    body: `Opbouw vrijdag is rond. De tenten staan, stroom ligt erop en de togen zijn in elkaar gezet.

Afbouw zaterdag wordt krapper. We hebben nog minstens twee extra handen nodig, vooral tussen 23u en 02u:

• tenten leegmaken en opvouwen
• hekken naar de aanhangwagen
• bekabeling oprollen bij de kassawagen

Wie kan, stuur een bericht. Foto's van de stand van zaken zitten bij deze melding, plus het plan van het terrein.`,
    time: "Vandaag 10:18",
    unread: true,
    kind: "general",
    category: "medewerkers",
    audience: ["admin"],
    attachments: [
      { id: "degi-1", name: "Tenten opbouw.jpg", type: "image", url: "/notifications/opbouw-1.svg" },
      { id: "degi-2", name: "Podium.jpg", type: "image", url: "/notifications/opbouw-2.svg" },
      { id: "degi-3", name: "Terreinplan.pdf", type: "file", url: "/notifications/terrein.svg" },
    ],
  },
  {
    id: "social-lineup",
    title: "Instagram-post gepland",
    body: `Eerste namen van Zeverrock 2026 staat klaar voor 18:00.

Caption is af, maar we willen nog een keuze maken uit de foto's. Er zitten drie beelden bij: de poster, de sfeerfoto en een tight crop voor stories.

Check of logo en datum goed leesbaar blijven op telefoon. Als het oké is, mag de post om 18u live.`,
    time: "Vandaag 12:00",
    unread: true,
    href: "/social-media/kalender",
    kind: "general",
    category: "social-media",
    audience: ["admin", "team"],
    attachments: [
      { id: "social-1", name: "Poster lineup.jpg", type: "image", url: "/notifications/lineup-1.svg" },
      { id: "social-2", name: "Sfeer.jpg", type: "image", url: "/notifications/lineup-2.svg" },
      { id: "social-3", name: "Terrein overzicht.jpg", type: "image", url: "/notifications/terrein.svg" },
    ],
  },
  {
    id: "docs-veiligheid",
    title: "Veiligheidsplan bijgewerkt",
    body: `Er staat een nieuwe versie van het veiligheidsplan klaar (v3, 18 augustus).

Wijzigingen:
• extra vluchtweg achter Toog B
• aangepaste contacten EHBO
• plan van het terrein in bijlage

Gelieve dit vóór vrijdag te bekijken en te bevestigen aan Yves.`,
    time: "Vandaag 08:05",
    unread: true,
    href: "/documenten",
    kind: "general",
    category: "documenten",
    audience: ["admin", "team"],
    attachments: [
      { id: "doc-1", name: "Veiligheidsplan-v3.pdf", type: "file", url: "/notifications/terrein.svg" },
      { id: "doc-2", name: "Terreinplan.jpg", type: "image", url: "/notifications/terrein.svg" },
    ],
  },
  {
    id: "sponsor-factuur",
    title: "Factuur Brouwerij Demo",
    body: "De sponsorfactuur is verstuurd en wacht op betaling.",
    time: "Vandaag 09:12",
    unread: true,
    href: "/sponsoring/brouwerij-demo/facturen",
    kind: "sponsoring",
    category: "sponsoring",
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
    category: "sponsoring",
    audience: ["admin", "team"],
  },
  {
    id: "note-team",
    title: "Zeverrock team",
    body: "De briefing van vrijdag staat klaar. Check je shift.",
    time: "Vandaag 09:12",
    unread: true,
    kind: "general",
    category: "medewerkers",
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
    category: "sponsoring",
    audience: ["admin", "team"],
  },
];
