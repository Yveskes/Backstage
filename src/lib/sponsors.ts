export type SponsorStatus = "prospect" | "confirmed" | "paid";

export type Sponsor = {
  id: string;
  year: number;
  name: string;
  contactName: string;
  contactEmail: string;
  packageTier: string;
  amount: number;
  status: SponsorStatus;
};

export type SponsorInvoice = {
  id: string;
  sponsorId: string;
  invoiceNumber: string;
  amount: number;
  status: "draft" | "sent" | "paid";
};

export type SponsorBenefit = {
  id: string;
  sponsorId: string;
  recipientName: string;
  quantity: number;
  status: "pending" | "issued" | "used";
};

export const mockSponsors: Sponsor[] = [
  {
    id: "brouwerij-demo",
    year: 2026,
    name: "Brouwerij Demo",
    contactName: "An Janssens",
    contactEmail: "an@brouwerijdemo.be",
    packageTier: "Goud",
    amount: 5000,
    status: "confirmed",
  },
  {
    id: "radio-centrum",
    year: 2026,
    name: "Radio Centrum",
    contactName: "Tom Peeters",
    contactEmail: "tom@radiocentrum.be",
    packageTier: "Zilver",
    amount: 2500,
    status: "paid",
  },
  {
    id: "lokaal-garage",
    year: 2026,
    name: "Garage Vandenberghe",
    contactName: "Els Vandenberghe",
    contactEmail: "els@garagevb.be",
    packageTier: "Brons",
    amount: 750,
    status: "prospect",
  },
  {
    id: "brouwerij-demo-2025",
    year: 2025,
    name: "Brouwerij Demo",
    contactName: "An Janssens",
    contactEmail: "an@brouwerijdemo.be",
    packageTier: "Goud",
    amount: 4500,
    status: "paid",
  },
  {
    id: "radio-centrum-2025",
    year: 2025,
    name: "Radio Centrum",
    contactName: "Tom Peeters",
    contactEmail: "tom@radiocentrum.be",
    packageTier: "Brons",
    amount: 1200,
    status: "paid",
  },
];

export const mockInvoices: SponsorInvoice[] = [
  { id: "inv-1", sponsorId: "brouwerij-demo", invoiceNumber: "ZR-2026-001", amount: 5000, status: "sent" },
  { id: "inv-2", sponsorId: "radio-centrum", invoiceNumber: "ZR-2026-002", amount: 2500, status: "paid" },
  { id: "inv-3", sponsorId: "lokaal-garage", invoiceNumber: "ZR-2026-003", amount: 750, status: "draft" },
];

export const mockDrinkVouchers: SponsorBenefit[] = [
  { id: "dv-1", sponsorId: "brouwerij-demo", recipientName: "Hospitality Brouwerij", quantity: 40, status: "issued" },
  { id: "dv-2", sponsorId: "radio-centrum", recipientName: "Radio team", quantity: 20, status: "pending" },
];

export const mockTickets: SponsorBenefit[] = [
  { id: "tk-1", sponsorId: "brouwerij-demo", recipientName: "Personeel Brouwerij", quantity: 12, status: "issued" },
  { id: "tk-2", sponsorId: "radio-centrum", recipientName: "Winactie", quantity: 8, status: "pending" },
];

export function getSponsor(id: string) {
  return mockSponsors.find((sponsor) => sponsor.id === id);
}

export function getSponsorsForYear(year: number) {
  return mockSponsors.filter((sponsor) => sponsor.year === year);
}

export function getSponsorName(id: string) {
  return getSponsor(id)?.name ?? "Onbekende sponsor";
}
