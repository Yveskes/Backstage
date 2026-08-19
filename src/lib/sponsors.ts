export type SponsorStatus = "prospect" | "confirmed" | "paid";
export type SponsorInvoiceStatus = "draft" | "sent" | "paid";
export type SponsorBenefitStatus = "pending" | "issued" | "used";
export type SponsorInvoiceLineKind = "package" | "drankbonnen" | "vrijkaarten" | "custom";
export type SponsorPackageId = "goud" | "zilver" | "brons" | "anders";

export const sponsorStatuses: SponsorStatus[] = ["prospect", "confirmed", "paid"];
export const sponsorPackageOptions: Array<{ id: SponsorPackageId; label: string }> = [
  { id: "goud", label: "Goud" },
  { id: "zilver", label: "Zilver" },
  { id: "brons", label: "Brons" },
  { id: "anders", label: "Anders" },
];

export const sponsorStatusLabel: Record<SponsorStatus, string> = {
  prospect: "Prospect",
  confirmed: "Bevestigd",
  paid: "Betaald",
};

export const sponsorInvoiceStatusLabel: Record<SponsorInvoiceStatus, string> = {
  draft: "Concept",
  sent: "Verzonden",
  paid: "Betaald",
};

export const sponsorBenefitStatusLabel: Record<SponsorBenefitStatus, string> = {
  pending: "Nog uit te reiken",
  issued: "Uitgereikt",
  used: "Gebruikt",
};

export type SponsorBilling = {
  companyName: string;
  vatNumber: string;
  street: string;
  postalCode: string;
  city: string;
  invoiceContactName: string;
  invoiceEmail: string;
};

export type SponsorExtraLine = {
  id: string;
  description: string;
  amount: number;
};

export type Sponsor = {
  id: string;
  year: number;
  name: string;
  contactName: string;
  contactEmail: string;
  packageId: SponsorPackageId;
  packageLabel: string;
  amount: number;
  status: SponsorStatus;
  billing: SponsorBilling;
  extraLines: SponsorExtraLine[];
};

export type SponsorInvoiceLine = {
  id: string;
  kind: SponsorInvoiceLineKind;
  description: string;
  quantity: number;
  amount: number;
};

export type SponsorInvoice = {
  id: string;
  sponsorId: string;
  invoiceNumber: string;
  amount: number;
  status: SponsorInvoiceStatus;
  createdAt: string;
  billedToName: string;
  billedToEmail: string;
  lines: SponsorInvoiceLine[];
};

export type SponsorBenefit = {
  id: string;
  sponsorId: string;
  recipientName: string;
  quantity: number;
  unitPrice: number;
  onInvoice: boolean;
  status: SponsorBenefitStatus;
};

export function emptyBilling(): SponsorBilling {
  return {
    companyName: "",
    vatNumber: "",
    street: "",
    postalCode: "",
    city: "",
    invoiceContactName: "",
    invoiceEmail: "",
  };
}

export function formatSponsorEuro(amount: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function parseEuroAmount(raw: string, { allowEmpty = false }: { allowEmpty?: boolean } = {}) {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) {
    return allowEmpty ? 0 : null;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

export function packageIdFromLabel(label: string): SponsorPackageId {
  const match = sponsorPackageOptions.find((option) => option.label.toLowerCase() === label.trim().toLowerCase());
  return match?.id ?? "anders";
}

export function invoiceContact(sponsor: Sponsor) {
  return {
    name: sponsor.billing.invoiceContactName.trim() || sponsor.contactName,
    email: sponsor.billing.invoiceEmail.trim() || sponsor.contactEmail,
  };
}

export function billingAddress(billing: SponsorBilling) {
  return [billing.street, [billing.postalCode, billing.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
}

export function benefitLineAmount(item: SponsorBenefit) {
  return Math.round(item.quantity * item.unitPrice * 100) / 100;
}

function isStatus(value: unknown): value is SponsorStatus {
  return sponsorStatuses.includes(value as SponsorStatus);
}

function isInvoiceStatus(value: unknown): value is SponsorInvoiceStatus {
  return value === "draft" || value === "sent" || value === "paid";
}

function isBenefitStatus(value: unknown): value is SponsorBenefitStatus {
  return value === "pending" || value === "issued" || value === "used";
}

function isPackageId(value: unknown): value is SponsorPackageId {
  return sponsorPackageOptions.some((option) => option.id === value);
}

function isLineKind(value: unknown): value is SponsorInvoiceLineKind {
  return value === "package" || value === "drankbonnen" || value === "vrijkaarten" || value === "custom";
}

export function normalizeBilling(raw: Partial<SponsorBilling> | undefined, fallback: { name: string; contactName: string; contactEmail: string }): SponsorBilling {
  const billing = raw ?? emptyBilling();
  return {
    companyName: String(billing.companyName ?? "").trim() || fallback.name,
    vatNumber: String(billing.vatNumber ?? "").trim(),
    street: String(billing.street ?? "").trim(),
    postalCode: String(billing.postalCode ?? "").trim(),
    city: String(billing.city ?? "").trim(),
    invoiceContactName: String(billing.invoiceContactName ?? "").trim() || fallback.contactName,
    invoiceEmail: String(billing.invoiceEmail ?? "").trim().toLowerCase() || fallback.contactEmail,
  };
}

export function normalizeExtraLines(raw: unknown): SponsorExtraLine[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const data = entry as Partial<SponsorExtraLine>;
    const description = String(data.description ?? "").trim();
    if (!description) {
      return [];
    }

    const amount = Number(data.amount);
    return [
      {
        id: String(data.id || `line-${crypto.randomUUID()}`),
        description,
        amount: Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : 0,
      },
    ];
  });
}

export function normalizeSponsor(raw: Partial<Sponsor> & { packageTier?: string }): Sponsor {
  const name = String(raw.name ?? "Sponsor").trim() || "Sponsor";
  const contactName = String(raw.contactName ?? "").trim();
  const contactEmail = String(raw.contactEmail ?? "").trim().toLowerCase();
  const packageLabel = String(raw.packageLabel ?? raw.packageTier ?? "Anders").trim() || "Anders";
  const amount = Number(raw.amount);

  return {
    id: String(raw.id || `sponsor-${crypto.randomUUID()}`),
    year: Number(raw.year) || 2026,
    name,
    contactName,
    contactEmail,
    packageId: isPackageId(raw.packageId) ? raw.packageId : packageIdFromLabel(packageLabel),
    packageLabel,
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    status: isStatus(raw.status) ? raw.status : "prospect",
    billing: normalizeBilling(raw.billing, { name, contactName, contactEmail }),
    extraLines: normalizeExtraLines(raw.extraLines),
  };
}

export function normalizeBenefit(raw: Partial<SponsorBenefit>): SponsorBenefit | null {
  if (!raw.id || !raw.sponsorId) {
    return null;
  }

  const quantity = Number(raw.quantity);
  const unitPrice = Number(raw.unitPrice);

  return {
    id: String(raw.id),
    sponsorId: String(raw.sponsorId),
    recipientName: String(raw.recipientName ?? "").trim() || "Ontvanger",
    quantity: Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : 1,
    unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? Math.round(unitPrice * 100) / 100 : 0,
    onInvoice: Boolean(raw.onInvoice),
    status: isBenefitStatus(raw.status) ? raw.status : "pending",
  };
}

export function normalizeInvoice(raw: Partial<SponsorInvoice> & { invoiceNumber?: string }): SponsorInvoice | null {
  if (!raw.id || !raw.sponsorId || !raw.invoiceNumber) {
    return null;
  }

  const amount = Number(raw.amount);
  const lines = Array.isArray(raw.lines)
    ? raw.lines.flatMap((line) => {
        if (!line || typeof line !== "object") {
          return [];
        }

        const data = line as Partial<SponsorInvoiceLine>;
        const description = String(data.description ?? "").trim();
        if (!description) {
          return [];
        }

        const lineAmount = Number(data.amount);
        const quantity = Number(data.quantity);
        return [
          {
            id: String(data.id || `inv-line-${crypto.randomUUID()}`),
            kind: isLineKind(data.kind) ? data.kind : "custom",
            description,
            quantity: Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : 1,
            amount: Number.isFinite(lineAmount) ? Math.round(lineAmount * 100) / 100 : 0,
          },
        ];
      })
    : [];

  return {
    id: String(raw.id),
    sponsorId: String(raw.sponsorId),
    invoiceNumber: String(raw.invoiceNumber),
    amount: Number.isFinite(amount) ? amount : lines.reduce((sum, line) => sum + line.amount, 0),
    status: isInvoiceStatus(raw.status) ? raw.status : "draft",
    createdAt: String(raw.createdAt || new Date().toISOString()),
    billedToName: String(raw.billedToName ?? "").trim(),
    billedToEmail: String(raw.billedToEmail ?? "").trim().toLowerCase(),
    lines,
  };
}

export function nextInvoiceNumber(invoices: SponsorInvoice[], year: number) {
  const prefix = `ZR-${year}-`;
  let max = 0;
  for (const invoice of invoices) {
    if (!invoice.invoiceNumber.startsWith(prefix)) {
      continue;
    }

    const value = Number(invoice.invoiceNumber.slice(prefix.length));
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  }

  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

export function buildInvoiceDraft(
  sponsor: Sponsor,
  drinkVouchers: SponsorBenefit[],
  tickets: SponsorBenefit[],
): { lines: Array<Omit<SponsorInvoiceLine, "id">>; total: number; contact: { name: string; email: string } } {
  const contact = invoiceContact(sponsor);
  const lines: Array<Omit<SponsorInvoiceLine, "id">> = [
    {
      kind: "package",
      description: `Sponsoring ${sponsor.packageLabel} ${sponsor.year}`,
      quantity: 1,
      amount: sponsor.amount,
    },
  ];

  for (const item of drinkVouchers.filter((entry) => entry.onInvoice)) {
    lines.push({
      kind: "drankbonnen",
      description: `Drankbonnen${item.recipientName ? ` · ${item.recipientName}` : ""} (${item.quantity} st.)`,
      quantity: item.quantity,
      amount: benefitLineAmount(item),
    });
  }

  for (const item of tickets.filter((entry) => entry.onInvoice)) {
    lines.push({
      kind: "vrijkaarten",
      description: `Vrijkaarten${item.recipientName ? ` · ${item.recipientName}` : ""} (${item.quantity} st.)`,
      quantity: item.quantity,
      amount: benefitLineAmount(item),
    });
  }

  for (const line of sponsor.extraLines) {
    lines.push({
      kind: "custom",
      description: line.description,
      quantity: 1,
      amount: line.amount,
    });
  }

  const total = Math.round(lines.reduce((sum, line) => sum + line.amount, 0) * 100) / 100;
  return { lines, total, contact };
}

const mockBillingDemo: SponsorBilling = {
  companyName: "Brouwerij Demo NV",
  vatNumber: "BE 0123.456.789",
  street: "Brouwerijstraat 12",
  postalCode: "9200",
  city: "Dendermonde",
  invoiceContactName: "An Janssens",
  invoiceEmail: "an@brouwerijdemo.be",
};

export const mockSponsors: Sponsor[] = [
  normalizeSponsor({
    id: "brouwerij-demo",
    year: 2026,
    name: "Brouwerij Demo",
    contactName: "An Janssens",
    contactEmail: "an@brouwerijdemo.be",
    packageId: "goud",
    packageLabel: "Goud",
    amount: 5000,
    status: "confirmed",
    billing: mockBillingDemo,
  }),
  normalizeSponsor({
    id: "radio-centrum",
    year: 2026,
    name: "Radio Centrum",
    contactName: "Tom Peeters",
    contactEmail: "tom@radiocentrum.be",
    packageId: "zilver",
    packageLabel: "Zilver",
    amount: 2500,
    status: "paid",
    billing: {
      companyName: "Radio Centrum",
      vatNumber: "BE 0987.654.321",
      street: "Zendmastlaan 4",
      postalCode: "9200",
      city: "Dendermonde",
      invoiceContactName: "Tom Peeters",
      invoiceEmail: "tom@radiocentrum.be",
    },
  }),
  normalizeSponsor({
    id: "lokaal-garage",
    year: 2026,
    name: "Garage Vandenberghe",
    contactName: "Els Vandenberghe",
    contactEmail: "els@garagevb.be",
    packageId: "brons",
    packageLabel: "Brons",
    amount: 750,
    status: "prospect",
  }),
  normalizeSponsor({
    id: "brouwerij-demo-2025",
    year: 2025,
    name: "Brouwerij Demo",
    contactName: "An Janssens",
    contactEmail: "an@brouwerijdemo.be",
    packageId: "goud",
    packageLabel: "Goud",
    amount: 4500,
    status: "paid",
    billing: { ...mockBillingDemo },
  }),
  normalizeSponsor({
    id: "radio-centrum-2025",
    year: 2025,
    name: "Radio Centrum",
    contactName: "Tom Peeters",
    contactEmail: "tom@radiocentrum.be",
    packageId: "brons",
    packageLabel: "Brons",
    amount: 1200,
    status: "paid",
  }),
];

export const mockInvoices: SponsorInvoice[] = [
  {
    id: "inv-1",
    sponsorId: "brouwerij-demo",
    invoiceNumber: "ZR-2026-001",
    amount: 5000,
    status: "sent",
    createdAt: "2026-03-12T10:00:00.000Z",
    billedToName: "An Janssens",
    billedToEmail: "an@brouwerijdemo.be",
    lines: [
      {
        id: "inv-1-p",
        kind: "package",
        description: "Sponsoring Goud 2026",
        quantity: 1,
        amount: 5000,
      },
    ],
  },
  {
    id: "inv-2",
    sponsorId: "radio-centrum",
    invoiceNumber: "ZR-2026-002",
    amount: 2500,
    status: "paid",
    createdAt: "2026-02-20T10:00:00.000Z",
    billedToName: "Tom Peeters",
    billedToEmail: "tom@radiocentrum.be",
    lines: [
      {
        id: "inv-2-p",
        kind: "package",
        description: "Sponsoring Zilver 2026",
        quantity: 1,
        amount: 2500,
      },
    ],
  },
  {
    id: "inv-3",
    sponsorId: "lokaal-garage",
    invoiceNumber: "ZR-2026-003",
    amount: 750,
    status: "draft",
    createdAt: "2026-04-02T10:00:00.000Z",
    billedToName: "Els Vandenberghe",
    billedToEmail: "els@garagevb.be",
    lines: [
      {
        id: "inv-3-p",
        kind: "package",
        description: "Sponsoring Brons 2026",
        quantity: 1,
        amount: 750,
      },
    ],
  },
];

export const mockDrinkVouchers: SponsorBenefit[] = [
  {
    id: "dv-1",
    sponsorId: "brouwerij-demo",
    recipientName: "Hospitality Brouwerij",
    quantity: 40,
    unitPrice: 2,
    onInvoice: true,
    status: "issued",
  },
  {
    id: "dv-2",
    sponsorId: "radio-centrum",
    recipientName: "Radio team",
    quantity: 20,
    unitPrice: 2,
    onInvoice: false,
    status: "pending",
  },
];

export const mockTickets: SponsorBenefit[] = [
  {
    id: "tk-1",
    sponsorId: "brouwerij-demo",
    recipientName: "Personeel Brouwerij",
    quantity: 12,
    unitPrice: 25,
    onInvoice: true,
    status: "issued",
  },
  {
    id: "tk-2",
    sponsorId: "radio-centrum",
    recipientName: "Winactie",
    quantity: 8,
    unitPrice: 25,
    onInvoice: false,
    status: "pending",
  },
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
