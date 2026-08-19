export type NavItem = {
  href: string;
  label: string;
  description: string;
  module?: import("@/lib/permissions").ModuleId;
  children?: NavItem[];
};

export const navigation: NavItem[] = [
  {
    href: "/",
    label: "Overzicht",
    description: "Meldingen en overzicht.",
  },
  {
    href: "/medewerkers",
    label: "Medewerkers",
    description: "Team, logins en rechten per persoon.",
    module: "medewerkers",
    children: [
      {
        href: "/medewerkers/planning",
        label: "Planning",
        description: "Wie werkt wanneer, aanwezigheid en vergoedingen.",
        module: "medewerkers",
      },
      {
        href: "/medewerkers/berichten",
        label: "Bericht per taak",
        description: "Stuur een melding naar een post.",
        module: "medewerkers",
      },
      {
        href: "/medewerkers/tshirts",
        label: "T-shirtlijst",
        description: "Bevestigde maten en bestelling.",
        module: "medewerkers",
      },
    ],
  },
  {
    href: "/social-media",
    label: "Social Media",
    description: "Kalender, posts en ideeën.",
    module: "social-media",
    children: [
      {
        href: "/social-media/kalender",
        label: "Kalender",
        description: "Planning van social posts.",
        module: "social-media",
      },
      {
        href: "/social-media/posts",
        label: "Posts",
        description: "Foto's en video's uploaden.",
        module: "social-media",
      },
      {
        href: "/social-media/ideeen",
        label: "Ideeën",
        description: "Contentideeën met screenshot of video.",
        module: "social-media",
      },
    ],
  },
  {
    href: "/documenten",
    label: "Documenten",
    description: "Bestanden uit Google Drive, per festivaljaar.",
    module: "documenten",
  },
  {
    href: "/media",
    label: "Media",
    description: "Foto's, video's en brandbook.",
    module: "media",
    children: [
      {
        href: "/media/foto",
        label: "Foto",
        description: "Foto's en beeldmateriaal.",
        module: "media",
      },
      {
        href: "/media/video",
        label: "Video",
        description: "Video's en bewegend beeld.",
        module: "media",
      },
      {
        href: "/media/brandbook",
        label: "Brandbook",
        description: "Huisstijl, logo's en merkrichtlijnen.",
        module: "media",
      },
    ],
  },
  {
    href: "/sponsoring",
    label: "Sponsoring",
    description: "Overzicht van sponsors per festivaljaar.",
    module: "sponsoring",
  },
];

export const staffNavigation: NavItem[] = [
  {
    href: "/mijn",
    label: "Overzicht",
    description: "Meldingen en jouw overzicht.",
  },
];

export const sponsorSubPages = ["facturen", "drankbonnen", "vrijkaarten"] as const;
export type SponsorSubPage = (typeof sponsorSubPages)[number];

export function getSponsorIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/sponsoring\/([^/]+)/);
  if (!match) {
    return null;
  }

  const segment = match[1];
  if ((sponsorSubPages as readonly string[]).includes(segment)) {
    return null;
  }

  return segment;
}
