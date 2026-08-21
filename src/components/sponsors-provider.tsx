"use client";

import { appDataKeys, loadAppData, saveAppData } from "@/app/(app)/data/actions";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

type SponsorsBundle = {
  sponsors: Sponsor[];
  invoices: SponsorInvoice[];
  drinkVouchers: SponsorBenefit[];
  tickets: SponsorBenefit[];
};

type SponsorsContextValue = {
  ready: boolean;
  sponsors: Sponsor[];
  invoices: SponsorInvoice[];
  drinkVouchers: SponsorBenefit[];
  tickets: SponsorBenefit[];
  getSponsor: (id: string) => Sponsor | undefined;
  updateSponsor: (id: string, patch: Partial<Sponsor>) => void;
  updateBilling: (id: string, billing: Partial<SponsorBilling>) => void;
  saveSponsor: (id: string, patch?: Partial<Sponsor>) => Promise<{ error?: string }>;
  addExtraLine: (sponsorId: string, line: { description: string; amount: number }) => Promise<{ error?: string }>;
  removeExtraLine: (sponsorId: string, lineId: string) => Promise<{ error?: string }>;
  addBenefit: (
    type: "drankbonnen" | "vrijkaarten",
    input: { sponsorId: string; recipientName: string; quantity: number; unitPrice: number; onInvoice: boolean },
  ) => Promise<{ error?: string }>;
  updateBenefit: (
    type: "drankbonnen" | "vrijkaarten",
    id: string,
    patch: Partial<Pick<SponsorBenefit, "onInvoice" | "status">>,
  ) => Promise<{ error?: string }>;
  removeBenefit: (type: "drankbonnen" | "vrijkaarten", id: string) => Promise<{ error?: string }>;
  generateInvoice: (sponsorId: string) => Promise<SponsorInvoice | { error: string }>;
  setInvoiceStatus: (id: string, status: SponsorInvoiceStatus) => Promise<{ error?: string }>;
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

function normalizeBundle(raw: Partial<SponsorsBundle> | null): SponsorsBundle {
  const sponsors = Array.isArray(raw?.sponsors)
    ? mergeById(
        mockSponsors,
        raw.sponsors.map((entry) => normalizeSponsor(entry as Partial<Sponsor>)),
      )
    : mockSponsors;

  const invoices = Array.isArray(raw?.invoices)
    ? mergeById(
        mockInvoices,
        raw.invoices
          .map((entry) => normalizeInvoice(entry as Partial<SponsorInvoice>))
          .filter((entry): entry is SponsorInvoice => Boolean(entry)),
      )
    : mockInvoices;

  const drinkVouchers = Array.isArray(raw?.drinkVouchers)
    ? raw.drinkVouchers
        .map((entry) => normalizeBenefit(entry as Partial<SponsorBenefit>))
        .filter((entry): entry is SponsorBenefit => Boolean(entry))
    : mockDrinkVouchers;

  const tickets = Array.isArray(raw?.tickets)
    ? raw.tickets
        .map((entry) => normalizeBenefit(entry as Partial<SponsorBenefit>))
        .filter((entry): entry is SponsorBenefit => Boolean(entry))
    : mockTickets;

  return { sponsors, invoices, drinkVouchers, tickets };
}

export function SponsorsProvider({ children }: { children: ReactNode }) {
  const [sponsors, setSponsors] = useState<Sponsor[]>(mockSponsors);
  const [invoices, setInvoices] = useState<SponsorInvoice[]>(mockInvoices);
  const [drinkVouchers, setDrinkVouchers] = useState<SponsorBenefit[]>(mockDrinkVouchers);
  const [tickets, setTickets] = useState<SponsorBenefit[]>(mockTickets);
  const [ready, setReady] = useState(false);
  const stateRef = useRef<SponsorsBundle>({
    sponsors: mockSponsors,
    invoices: mockInvoices,
    drinkVouchers: mockDrinkVouchers,
    tickets: mockTickets,
  });

  useEffect(() => {
    stateRef.current = { sponsors, invoices, drinkVouchers, tickets };
  }, [drinkVouchers, invoices, sponsors, tickets]);

  const persist = useCallback(async (bundle: SponsorsBundle) => {
    const result = await saveAppData(appDataKeys.sponsors, bundle);
    if (!result.error) {
      window.localStorage.setItem(SPONSORS_KEY, JSON.stringify(bundle.sponsors));
      window.localStorage.setItem(INVOICES_KEY, JSON.stringify(bundle.invoices));
      window.localStorage.setItem(DRINKS_KEY, JSON.stringify(bundle.drinkVouchers));
      window.localStorage.setItem(TICKETS_KEY, JSON.stringify(bundle.tickets));
    }
    return result;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const fromDb = await loadAppData<Partial<SponsorsBundle>>(appDataKeys.sponsors);
      if (cancelled) {
        return;
      }

      if (fromDb && Array.isArray(fromDb.sponsors)) {
        const bundle = normalizeBundle(fromDb);
        setSponsors(bundle.sponsors);
        setInvoices(bundle.invoices);
        setDrinkVouchers(bundle.drinkVouchers);
        setTickets(bundle.tickets);
        setReady(true);
        return;
      }

      const local = normalizeBundle({
        sponsors: readJson<unknown[]>(SPONSORS_KEY)?.map((entry) =>
          normalizeSponsor(entry as Partial<Sponsor>),
        ),
        invoices: readJson<unknown[]>(INVOICES_KEY)
          ?.map((entry) => normalizeInvoice(entry as Partial<SponsorInvoice>))
          .filter((entry): entry is SponsorInvoice => Boolean(entry)),
        drinkVouchers: readJson<unknown[]>(DRINKS_KEY)
          ?.map((entry) => normalizeBenefit(entry as Partial<SponsorBenefit>))
          .filter((entry): entry is SponsorBenefit => Boolean(entry)),
        tickets: readJson<unknown[]>(TICKETS_KEY)
          ?.map((entry) => normalizeBenefit(entry as Partial<SponsorBenefit>))
          .filter((entry): entry is SponsorBenefit => Boolean(entry)),
      });

      setSponsors(local.sponsors);
      setInvoices(local.invoices);
      setDrinkVouchers(local.drinkVouchers);
      setTickets(local.tickets);
      setReady(true);
      void persist(local);
    })();

    return () => {
      cancelled = true;
    };
  }, [persist]);

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

  const saveSponsor = useCallback(
    async (id: string, patch?: Partial<Sponsor>) => {
      const nextSponsors = stateRef.current.sponsors.map((sponsor) => {
        if (sponsor.id !== id) {
          return sponsor;
        }

        const fromState = sponsors.find((entry) => entry.id === id) ?? sponsor;
        return normalizeSponsor({ ...fromState, ...patch, id });
      });

      setSponsors(nextSponsors);
      stateRef.current = { ...stateRef.current, sponsors: nextSponsors };
      return persist({ ...stateRef.current, sponsors: nextSponsors });
    },
    [persist, sponsors],
  );

  const persistCurrent = useCallback(async () => {
    return persist(stateRef.current);
  }, [persist]);

  const addExtraLine = useCallback(
    async (sponsorId: string, line: { description: string; amount: number }) => {
      const extra: SponsorExtraLine = {
        id: crypto.randomUUID(),
        description: line.description.trim(),
        amount: line.amount,
      };

      const nextSponsors = stateRef.current.sponsors.map((sponsor) =>
        sponsor.id === sponsorId ? { ...sponsor, extraLines: [...sponsor.extraLines, extra] } : sponsor,
      );
      setSponsors(nextSponsors);
      stateRef.current = { ...stateRef.current, sponsors: nextSponsors };
      return persist({ ...stateRef.current, sponsors: nextSponsors });
    },
    [persist],
  );

  const removeExtraLine = useCallback(
    async (sponsorId: string, lineId: string) => {
      const nextSponsors = stateRef.current.sponsors.map((sponsor) =>
        sponsor.id === sponsorId
          ? { ...sponsor, extraLines: sponsor.extraLines.filter((line) => line.id !== lineId) }
          : sponsor,
      );
      setSponsors(nextSponsors);
      stateRef.current = { ...stateRef.current, sponsors: nextSponsors };
      return persist({ ...stateRef.current, sponsors: nextSponsors });
    },
    [persist],
  );

  const addBenefit = useCallback(
    async (
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

      if (type === "drankbonnen") {
        const next = [...stateRef.current.drinkVouchers, item];
        setDrinkVouchers(next);
        stateRef.current = { ...stateRef.current, drinkVouchers: next };
      } else {
        const next = [...stateRef.current.tickets, item];
        setTickets(next);
        stateRef.current = { ...stateRef.current, tickets: next };
      }

      return persistCurrent();
    },
    [persistCurrent],
  );

  const updateBenefit = useCallback(
    async (
      type: "drankbonnen" | "vrijkaarten",
      id: string,
      patch: Partial<Pick<SponsorBenefit, "onInvoice" | "status">>,
    ) => {
      if (type === "drankbonnen") {
        const next = stateRef.current.drinkVouchers.map((item) =>
          item.id === id ? { ...item, ...patch } : item,
        );
        setDrinkVouchers(next);
        stateRef.current = { ...stateRef.current, drinkVouchers: next };
      } else {
        const next = stateRef.current.tickets.map((item) => (item.id === id ? { ...item, ...patch } : item));
        setTickets(next);
        stateRef.current = { ...stateRef.current, tickets: next };
      }

      return persistCurrent();
    },
    [persistCurrent],
  );

  const removeBenefit = useCallback(
    async (type: "drankbonnen" | "vrijkaarten", id: string) => {
      if (type === "drankbonnen") {
        const next = stateRef.current.drinkVouchers.filter((item) => item.id !== id);
        setDrinkVouchers(next);
        stateRef.current = { ...stateRef.current, drinkVouchers: next };
      } else {
        const next = stateRef.current.tickets.filter((item) => item.id !== id);
        setTickets(next);
        stateRef.current = { ...stateRef.current, tickets: next };
      }

      return persistCurrent();
    },
    [persistCurrent],
  );

  const generateInvoice = useCallback(
    async (sponsorId: string) => {
      const sponsor = stateRef.current.sponsors.find((item) => item.id === sponsorId);
      if (!sponsor) {
        return { error: "Sponsor niet gevonden." };
      }

      const drinks = stateRef.current.drinkVouchers.filter((item) => item.sponsorId === sponsorId);
      const passes = stateRef.current.tickets.filter((item) => item.sponsorId === sponsorId);
      const draft = buildInvoiceDraft(sponsor, drinks, passes);
      if (draft.lines.length === 0) {
        return { error: "Er staat niets op de factuur." };
      }

      const invoice: SponsorInvoice = {
        id: crypto.randomUUID(),
        sponsorId,
        invoiceNumber: nextInvoiceNumber(stateRef.current.invoices, sponsor.year),
        amount: draft.total,
        status: "draft",
        createdAt: new Date().toISOString(),
        billedToName: draft.contact.name,
        billedToEmail: draft.contact.email,
        lines: draft.lines.map((line) => ({ ...line, id: crypto.randomUUID() })),
      };

      const nextInvoices = [invoice, ...stateRef.current.invoices];
      setInvoices(nextInvoices);
      stateRef.current = { ...stateRef.current, invoices: nextInvoices };
      const result = await persist({ ...stateRef.current, invoices: nextInvoices });
      if (result.error) {
        return { error: result.error };
      }
      return invoice;
    },
    [persist],
  );

  const setInvoiceStatus = useCallback(
    async (id: string, status: SponsorInvoiceStatus) => {
      const nextInvoices = stateRef.current.invoices.map((invoice) =>
        invoice.id === id ? { ...invoice, status } : invoice,
      );
      setInvoices(nextInvoices);
      stateRef.current = { ...stateRef.current, invoices: nextInvoices };
      return persist({ ...stateRef.current, invoices: nextInvoices });
    },
    [persist],
  );

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
      saveSponsor,
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
      saveSponsor,
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
