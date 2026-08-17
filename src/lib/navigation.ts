export type NavItem = {
  href: string;
  label: string;
  description: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const navigation: NavSection[] = [
  {
    title: "Overzicht",
    items: [
      {
        href: "/",
        label: "Dashboard",
        description: "Status, taken en snelle toegang tot de app.",
      },
    ],
  },
  {
    title: "Inhoud",
    items: [
      {
        href: "/documenten",
        label: "Documenten",
        description: "Centrale mappen met versies per festivaljaar.",
      },
      {
        href: "/downloads",
        label: "Downloads",
        description: "Brandbook, logo's en andere vaste assets.",
      },
    ],
  },
  {
    title: "Mensen",
    items: [
      {
        href: "/medewerkers",
        label: "Medewerkers",
        description: "Team, logins en rechten per persoon.",
      },
    ],
  },
  {
    title: "Commercieel",
    items: [
      {
        href: "/sponsors",
        label: "Sponsors",
        description: "Sponsors, pakketten en opvolging.",
      },
      {
        href: "/facturen",
        label: "Facturen",
        description: "Facturen naar sponsors versturen en opvolgen.",
      },
      {
        href: "/social",
        label: "Social media",
        description: "Kalender, planning en promo-posts.",
      },
    ],
  },
  {
    title: "Uitgifte",
    items: [
      {
        href: "/vrijkaarten",
        label: "Vrijkaarten",
        description: "Gastlijst en vrijkaarten beheren.",
      },
      {
        href: "/drankbonnen",
        label: "Drankbonnen",
        description: "Drankbonnen uitgeven en opvolgen.",
      },
    ],
  },
  {
    title: "Systeem",
    items: [
      {
        href: "/instellingen",
        label: "Instellingen",
        description: "Festivaljaar, rollen en algemene instellingen.",
      },
    ],
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return navigation.flatMap((section) => section.items).find((item) => item.href === pathname);
}
