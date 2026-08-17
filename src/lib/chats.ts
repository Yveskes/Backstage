import type { AppUser } from "@/lib/permissions";

export type ChatPreview = {
  id: string;
  fromName: string;
  preview: string;
  time: string;
  unread: boolean;
};

export function chatPreviewsFor(user: AppUser): ChatPreview[] {
  if (user.kind === "staff") {
    return [
      {
        id: "team",
        fromName: "Zeverrock team",
        preview: "De briefing van vrijdag staat klaar. Check je shift.",
        time: "Vandaag 09:12",
        unread: true,
      },
    ];
  }

  return [
    {
      id: "an",
      fromName: "An Janssens",
      preview: "Kan ik zaterdag extra op toog A? De shift is wat krap.",
      time: "Vandaag 11:04",
      unread: true,
    },
    {
      id: "degi",
      fromName: "Degi",
      preview: "Opbouw vrijdag is rond. Afbouw zaterdag nog twee extra handen nodig.",
      time: "Vandaag 10:18",
      unread: true,
    },
  ];
}
