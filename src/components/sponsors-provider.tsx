"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  buildInvoiceDraft,
  mockDrinkVouchers,
  mockInvoices,
  mockSponsors,
  mockTickets,
  nextInvoiceNumber,
  normalizeBenefit,
  normalizeInvoice,
  normalizeSponsor,
  type Sponsor,
  type SponsorBenefit,
  type SponsorBilling,
  type SponsorExtraLine,
  type SponsorInvoice,
  type SponsorInvoiceStatus,
} from "@/lib/sponsors";

const SPONSORS_KEY = "backstage.sponsors";
const INVOICES_KEY = "backstage.sponsorInvoices";
const DRINKS_KEY = "backstage.sponsorDrinks";
const TICKETS_KEY = "backstage.sponsorTickets";

type SponsorsContextValue = {
  ready: boolean;
  sponsors: Sponsor[];
  invoices: SponsorInvoice[];
  drinkVouchers: SponsorBenefit[];
  tickets: SponsorBenefit[];
  getSponsor: (id: string) => Sponsor | undefined;
  updateSponsor: (id: string, patch: Partial<Sponsor>) => void;
  updateBilling: (id: string, billing: Partial<SponsorBilling>) => void;
  addExtraLine: (sponsorId: string, line: { description: string; amount: number }) => void;
  removeExtraLine: (sponsorId: string, lineId: string) => void;
  addBenefit: (
    type: "drankbonnen" | "vrijkaarten",
    input: { sponsorId: string; recipientName: string; quantity: number; unitPrice: number; onInvoice: boolean },
  ) => void;
  updateBenefit: (
    type: "drankbonnen" | "vrijkaarten",
    id: string,
    patch: Partial<Pick<SponsorBenefit, "onInvoice" | "status">>,
  ) => void;
  removeBenefit: (type: "drankbonnen" | "vrijkaarten", id: string) => void;
  generateInvoice: (sponsorId: string) => SponsorInvoice | { error: string };
  setInvoiceStatus: (id: string, status: SponsorInvoiceStatus) => void;
};

const SponsorsContext = createContext<SponsorsContextValue | null>(null);

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function mergeById<T extends { id: string }>(defaults: T[], stored: T[] | null): T[] {
  if (!stored || stored.length === 0) {
    return defaults;
  }

  const map = new Map(defaults.map((item) => [item.id, item]));
  for (const item of stored) {
    map.set(item.id, item);
  }
  return [...map.values()];
}

export function SponsorsProvider({ children }: { children: ReactNode }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(mockSponsors);
  const [invoices, setInvoices] = useState<SponsorInvoice[]>(mockInvoices);
  const [drinkVouchers, setDrinkVouchers] = useState<SponsorBenefit[]>(mockDrinkVouchers);
  const [tickets, setTickets] = useState<SponsorBenefit[]>(mockTickets);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedSponsors = readJson<unknown[]>(SPONSORS_KEY);
    const storedInvoices = readJson<unknown[]>(INVOICES_KEY);
    const storedDrinks = readJson<unknown[]>(DRINKS_KEY);
    const storedTickets = readJson<unknown[]>(TICKETS_KEY);

    if (Array.isArray(storedSponsors)) {
      setSponsors(
        mergeById(
          mockSponsors,
          storedSponsors.map((entry) => normalizeSponsor(entry as Partial<Sponsor>)),
        ),
      );
    }

    if (Array.isArray(storedInvoices)) {
      setInvoices(
        mergeById(
          mockInvoices,
          storedInvoices
            .map((entry) => normalizeInvoice(entry as Partial<SponsorInvoice>))
            .filter((entry): entry is SponsorInvoice => Boolean(entry)),
        ),
      );
    }

    if (Array.isArray(storedDrinks)) {
      setDrinkVouchers(
        storedDrinks
          .map((entry) => normalizeBenefit(entry as Partial<SponsorBenefit>))
          .filter((entry): entry is SponsorBenefit => Boolean(entry)),
      );
    }

    if (Array.isArray(storedTickets)) {
      setTickets(
        storedTickets
          .map((entry) => normalizeBenefit(entry as Partial<SponsorBenefit>))
          .filter((entry): entry is SponsorBenefit => Boolean(entry)),
      );
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(SPONSORS_KEY, JSON.stringify(sponsors));
    window.localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    window.localStorage.setItem(DRINKS_KEY, JSON.stringify(drinkVouchers));
    window.localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  }, [drinkVouchers, invoices, ready, sponsors, tickets]);

  const getSponsor = useCallback((id: string) => sponsors.find((sponsor) => sponsor.id === id), [sponsors]);

  const updateSponsor = useCallback((id: string, patch: Partial<Sponsor>) => {
    setSponsors((current) =>
      current.map((sponsor) => (sponsor.id === id ? normalizeSponsor({ ...sponsor, ...patch, id }) : sponsor)),
    );
  }, []);

  const updateBilling = useCallback((id: string, billing: Partial<SponsorBilling>) => {
    setSponsors((current) =>
      current.map((sponsor) =>
        sponsor.id === id
          ? normalizeSponsor({ ...sponsor, billing: { ...sponsor.billing, ...billing } })
          : sponsor,
      ),
    );
  }, []);

  const addExtraLine = useCallback((sponsorId: string, line: { description: string; amount: number }) => {
    const extra: SponsorExtraLine = {
      id: crypto.randomUUID(),
      description: line.description.trim(),
      amount: line.amount,
    };

    setSponsors((current) =>
      current.map((sponsor) =>
        sponsor.id === sponsorId ? { ...sponsor, extraLines: [...sponsor.extraLines, extra] } : sponsor,
      ),
    );
  }, []);

  const removeExtraLine = useCallback((sponsorId: string, lineId: string) => {
    setSponsors((current) =>
      current.map((sponsor) =>
        sponsor.id === sponsorId
          ? { ...sponsor, extraLines: sponsor.extraLines.filter((line) => line.id !== lineId) }
          : sponsor,
      ),
    );
  }, []);

  const addBenefit = useCallback(
    (
      type: "drankbonnen" | "vrijkaarten",
      input: { sponsorId: string; recipientName: string; quantity: number; unitPrice: number; onInvoice: boolean },
    ) => {
      const item: SponsorBenefit = {
        id: crypto.randomUUID(),
        sponsorId: input.sponsorId,
        recipientName: input.recipientName.trim() || "Ontvanger",
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        onInvoice: input.onInvoice,
        status: "pending",
      };
      const setter = type === "drankbonnen" ? setDrinkVouchers : setTickets;
      setter((current) => [...current, item]);
    },
    [],
  );

  const updateBenefit = useCallback(
    (
      type: "drankbonnen" | "vrijkaarten",
      id: string,
      patch: Partial<Pick<SponsorBenefit, "onInvoice" | "status">>,
    ) => {
      const setter = type === "drankbonnen" ? setDrinkVouchers : setTickets;
      setter((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    },
    [],
  );

  const removeBenefit = useCallback((type: "drankbonnen" | "vrijkaarten", id: string) => {
    const setter = type === "drankbonnen" ? setDrinkVouchers : setTickets;
    setter((current) => current.filter((item) => item.id !== id));
  }, []);

  const generateInvoice = useCallback(
    (sponsorId: string) => {
      const sponsor = sponsors.find((item) => item.id === sponsorId);
      if (!sponsor) {
        return { error: "Sponsor niet gevonden." };
      }

      const drinks = drinkVouchers.filter((item) => item.sponsorId === sponsorId);
      const passes = tickets.filter((item) => item.sponsorId === sponsorId);
      const draft = buildInvoiceDraft(sponsor, drinks, passes);
      if (draft.lines.length === 0) {
        return { error: "Er staat niets op de factuur." };
      }

      const invoice: SponsorInvoice = {
        id: crypto.randomUUID(),
        sponsorId,
        invoiceNumber: nextInvoiceNumber(invoices, sponsor.year),
        amount: draft.total,
        status: "draft",
        createdAt: new Date().toISOString(),
        billedToName: draft.contact.name,
        billedToEmail: draft.contact.email,
        lines: draft.lines.map((line) => ({ ...line, id: crypto.randomUUID() })),
      };

      setInvoices((current) => [invoice, ...current]);
      return invoice;
    },
    [drinkVouchers, invoices, sponsors, tickets],
  );

  const setInvoiceStatus = useCallback((id: string, status: SponsorInvoiceStatus) => {
    setInvoices((current) => current.map((invoice) => (invoice.id === id ? { ...invoice, status } : invoice)));
  }, []);

  const value = useMemo<SponsorsContextValue>(
    () => ({
      ready,
      sponsors,
      invoices,
      drinkVouchers,
      tickets,
      getSponsor,
      updateSponsor,
      updateBilling,
      addExtraLine,
      removeExtraLine,
      addBenefit,
      updateBenefit,
      removeBenefit,
      generateInvoice,
      setInvoiceStatus,
    }),
    [
      addBenefit,
      addExtraLine,
      drinkVouchers,
      generateInvoice,
      getSponsor,
      invoices,
      ready,
      removeBenefit,
      removeExtraLine,
      setInvoiceStatus,
      sponsors,
      tickets,
      updateBenefit,
      updateBilling,
      updateSponsor,
    ],
  );

  return <SponsorsContext.Provider value={value}>{children}</SponsorsContext.Provider>;
}

export function useSponsors() {
  const context = useContext(SponsorsContext);
  if (!context) {
    throw new Error("useSponsors must be used within SponsorsProvider");
  }

  return context;
}
