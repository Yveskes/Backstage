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
    label: "Mijn pagina",
    description: "Meldingen en overzicht.",
  },
  {
    href: "/medewerkers",
    label: "Medewerkers",
    description: "Team, logins en rechten per persoon.",
    module: "medewerkers",
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
    description: "Centrale mappen met versies per festivaljaar.",
    module: "documenten",
  },
  {
    href: "/media",
    label: "Media",
    description: "Logo's, brandbook, foto's en downloadbare assets.",
    module: "media",
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
    label: "Mijn pagina",
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
