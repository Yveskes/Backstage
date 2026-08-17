export const socialPlatforms = ["instagram", "facebook", "tiktok", "stories"] as const;
export type SocialPlatform = (typeof socialPlatforms)[number];

export const socialPlatformLabel: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  stories: "Stories",
};

export const socialPostStatuses = ["draft", "scheduled", "published"] as const;
export type SocialPostStatus = (typeof socialPostStatuses)[number];

export const socialPostStatusLabel: Record<SocialPostStatus, string> = {
  draft: "Concept",
  scheduled: "Gepland",
  published: "Geplaatst",
};

export type SocialMediaFile = {
  id: string;
  kind: "image" | "video";
  name: string;
  mime: string;
};

export type SocialPost = {
  id: string;
  caption: string;
  platform: SocialPlatform;
  status: SocialPostStatus;
  date: string;
  time: string;
  media: SocialMediaFile | null;
  createdBy: string;
};

export type SocialIdea = {
  id: string;
  title: string;
  body: string;
  media: SocialMediaFile | null;
  createdBy: string;
  createdAt: string;
};

export const defaultSocialPosts: SocialPost[] = [
  {
    id: "post-lineup",
    caption: "Eerste namen van Zeverrock 2026. Meer volgt.",
    platform: "instagram",
    status: "scheduled",
    date: "2026-08-18",
    time: "18:00",
    media: null,
    createdBy: "Yves",
  },
  {
    id: "post-vrijwilligers",
    caption: "Nog plek in de barploeg. Stuur een bericht als je mee wilt doen.",
    platform: "facebook",
    status: "published",
    date: "2026-08-12",
    time: "12:00",
    media: null,
    createdBy: "Degi",
  },
  {
    id: "post-aftermovie",
    caption: "Aftermovie-teaser klaarzetten voor stories.",
    platform: "stories",
    status: "draft",
    date: "2026-08-22",
    time: "20:00",
    media: null,
    createdBy: "Yves",
  },
];

export const defaultSocialIdeas: SocialIdea[] = [
  {
    id: "idea-drone",
    title: "Drone-shot van de weide",
    body: "Bij zonsondergang over de camping, met het podium op de achtergrond.",
    media: null,
    createdBy: "Degi",
    createdAt: "2026-08-10",
  },
];

export const MAX_SOCIAL_FILE_BYTES = 25 * 1024 * 1024;

export function mediaKindFromFile(file: File): SocialMediaFile["kind"] | null {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return null;
}
