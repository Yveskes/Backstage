"use client";

import { SponsorBenefitsEditor } from "@/components/sponsor-benefits-editor";
import { TrashIcon } from "@/components/icons";
import { SaveBar } from "@/components/save-bar";
import { useSponsors } from "@/components/sponsors-provider";
import {
  buildInvoiceDraft,
  formatSponsorEuro,
  parseEuroAmount,
  sponsorInvoiceStatusLabel,
  sponsorPackageOptions,
  sponsorStatusLabel,
  sponsorStatuses,
  type Sponsor,
  type SponsorBenefit,
  type SponsorBilling,
  type SponsorInvoice,
  type SponsorPackageId,
  type SponsorStatus,
} from "@/lib/sponsors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

const fieldClass =
  "mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function SponsorOverview({ sponsorId }: { sponsorId: string }) {
  const { getSponsor, drinkVouchers, tickets, invoices } = useSponsors();
  const sponsor = getSponsor(sponsorId);

  if (!sponsor) {
    return <p className="text-sm text-zinc-500">Deze sponsor bestaat niet.</p>;
  }

  const drinks = drinkVouchers.filter((item) => item.sponsorId === sponsorId);
  const passes = tickets.filter((item) => item.sponsorId === sponsorId);
  const sponsorInvoices = invoices.filter((invoice) => invoice.sponsorId === sponsorId);

  return (
    <div className="space-y-5">
      <PackageSection sponsor={sponsor} />
      <BillingSection sponsor={sponsor} />
      <Section
        title="Vrijkaarten"
        description="Kaarten voor deze sponsor. Zet aan wat mee op de factuur moet."
      >
        <SponsorBenefitsEditor sponsorId={sponsorId} type="vrijkaarten" compact />
      </Section>
      <Section
        title="Drankbonnen"
        description="Bonnen voor deze sponsor. Zet aan wat mee op de factuur moet."
      >
        <SponsorBenefitsEditor sponsorId={sponsorId} type="drankbonnen" compact />
      </Section>
      <ExtraLinesSection sponsor={sponsor} />
      <InvoiceSection sponsor={sponsor} drinks={drinks} tickets={passes} invoices={sponsorInvoices} />
    </div>
  );
}

function PackageSection({ sponsor }: { sponsor: Sponsor }) {
  const { saveSponsor } = useSponsors();
  const [packageId, setPackageId] = useState<SponsorPackageId>(sponsor.packageId);
  const [status, setStatus] = useState<SponsorStatus>(sponsor.status);
  const [amount, setAmount] = useState(String(sponsor.amount).replace(".", ","));
  const [customLabel, setCustomLabel] = useState(sponsor.packageId === "anders" ? sponsor.packageLabel : "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPackageId(sponsor.packageId);
    setStatus(sponsor.status);
    setAmount(String(sponsor.amount).replace(".", ","));
    setCustomLabel(sponsor.packageId === "anders" ? sponsor.packageLabel : "");
    setMessage(null);
    setError(null);
  }, [sponsor.amount, sponsor.id, sponsor.packageId, sponsor.packageLabel, sponsor.status]);

  const option = sponsorPackageOptions.find((entry) => entry.id === packageId);
  const packageLabel =
    packageId === "anders" ? customLabel.trim() || "Anders" : (option?.label ?? sponsor.packageLabel);
  const parsedAmount = parseEuroAmount(amount);
  const dirty =
    packageId !== sponsor.packageId ||
    status !== sponsor.status ||
    packageLabel !== sponsor.packageLabel ||
    (parsedAmount !== null && parsedAmount !== sponsor.amount) ||
    amount.trim() !== String(sponsor.amount).replace(".", ",");

  async function onSave() {
    if (parsedAmount === null) {
      setError("Vul een geldig bedrag in.");
      return;
    }

    setSaving(true);
    setError(null);
    const result = await saveSponsor(sponsor.id, {
      packageId,
      packageLabel,
      amount: parsedAmount,
      status,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Opgeslagen.");
  }

  function onReset() {
    setPackageId(sponsor.packageId);
    setStatus(sponsor.status);
    setAmount(String(sponsor.amount).replace(".", ","));
    setCustomLabel(sponsor.packageId === "anders" ? sponsor.packageLabel : "");
    setMessage(null);
    setError(null);
  }

  return (
    <Section title="Pakket" description="Kies het type sponsor en het bedrag van de sponsoring.">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Type</span>
          <select
            value={packageId}
            onChange={(event) => {
              setPackageId(event.target.value as SponsorPackageId);
              setMessage(null);
            }}
            className={fieldClass}
          >
            {sponsorPackageOptions.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Bedrag sponsoring</span>
          <input
            value={amount}
            onChange={(event) => {
              setAmount(event.target.value);
              setMessage(null);
            }}
            inputMode="decimal"
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as SponsorStatus);
              setMessage(null);
            }}
            className={fieldClass}
          >
            {sponsorStatuses.map((entry) => (
              <option key={entry} value={entry}>
                {sponsorStatusLabel[entry]}
              </option>
            ))}
          </select>
        </label>
        {packageId === "anders" ? (
          <label className="block text-sm sm:col-span-3">
            <span className="font-medium text-zinc-700">Omschrijving type</span>
            <input
              value={customLabel}
              onChange={(event) => {
                setCustomLabel(event.target.value);
                setMessage(null);
              }}
              placeholder="bv. Naturel, Media, In natura"
              className={fieldClass}
            />
          </label>
        ) : null}
      </div>
      <SaveBar
        dirty={dirty}
        saving={saving}
        message={message}
        error={error}
        alwaysShow
        onSave={() => void onSave()}
        onReset={onReset}
      />
    </Section>
  );
}

function BillingSection({ sponsor }: { sponsor: Sponsor }) {
  const { saveSponsor } = useSponsors();
  const [draft, setDraft] = useState({
    billing: sponsor.billing,
    contactName: sponsor.contactName,
    contactEmail: sponsor.contactEmail,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      billing: sponsor.billing,
      contactName: sponsor.contactName,
      contactEmail: sponsor.contactEmail,
    });
    setMessage(null);
    setError(null);
  }, [sponsor.billing, sponsor.contactEmail, sponsor.contactName, sponsor.id]);

  const dirty =
    JSON.stringify(draft.billing) !== JSON.stringify(sponsor.billing) ||
    draft.contactName !== sponsor.contactName ||
    draft.contactEmail !== sponsor.contactEmail;

  function patchBilling(patch: Partial<SponsorBilling>) {
    setDraft((current) => ({ ...current, billing: { ...current.billing, ...patch } }));
    setMessage(null);
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    const result = await saveSponsor(sponsor.id, {
      billing: draft.billing,
      contactName: draft.contactName.trim(),
      contactEmail: draft.contactEmail.trim().toLowerCase(),
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setMessage("Opgeslagen.");
  }

  function onReset() {
    setDraft({
      billing: sponsor.billing,
      contactName: sponsor.contactName,
      contactEmail: sponsor.contactEmail,
    });
    setMessage(null);
    setError(null);
  }

  const billing = draft.billing;

  return (
    <Section
      title="Facturatiegegevens"
      description="Adres en contactpersoon waar de factuur naartoe mag. Dit e-mailadres wordt gebruikt om te mailen."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700">Bedrijfsnaam</span>
          <input
            value={billing.companyName}
            onChange={(event) => patchBilling({ companyName: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">BTW-nummer</span>
          <input
            value={billing.vatNumber}
            onChange={(event) => patchBilling({ vatNumber: event.target.value })}
            placeholder="BE 0xxx.xxx.xxx"
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Contactpersoon factuur</span>
          <input
            value={billing.invoiceContactName}
            onChange={(event) => patchBilling({ invoiceContactName: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700">Straat en nummer</span>
          <input
            value={billing.street}
            onChange={(event) => patchBilling({ street: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Postcode</span>
          <input
            value={billing.postalCode}
            onChange={(event) => patchBilling({ postalCode: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Gemeente</span>
          <input
            value={billing.city}
            onChange={(event) => patchBilling({ city: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-zinc-700">E-mail voor factuur</span>
          <input
            type="email"
            value={billing.invoiceEmail}
            onChange={(event) => patchBilling({ invoiceEmail: event.target.value })}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Algemene contactpersoon</span>
          <input
            value={draft.contactName}
            onChange={(event) => {
              setDraft((current) => ({ ...current, contactName: event.target.value }));
              setMessage(null);
            }}
            className={fieldClass}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700">Algemene e-mail</span>
          <input
            type="email"
            value={draft.contactEmail}
            onChange={(event) => {
              setDraft((current) => ({ ...current, contactEmail: event.target.value }));
              setMessage(null);
            }}
            className={fieldClass}
          />
        </label>
      </div>
      <SaveBar
        dirty={dirty}
        saving={saving}
        message={message}
        error={error}
        alwaysShow
        onSave={() => void onSave()}
        onReset={onReset}
      />
    </Section>
  );
}

function ExtraLinesSection({ sponsor }: { sponsor: Sponsor }) {
  const { addExtraLine, removeExtraLine } = useSponsors();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseEuroAmount(amount, { allowEmpty: true });
    if (!description.trim()) {
      setError("Vul een omschrijving in.");
      return;
    }
    if (parsed === null) {
      setError("Vul een geldig bedrag in, of laat leeg.");
      return;
    }

    setBusy(true);
    const result = await addExtraLine(sponsor.id, { description: description.trim(), amount: parsed });
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setDescription("");
    setAmount("");
    setError(null);
  }

  return (
    <Section
      title="Extra factuurlijnen"
      description="Eigen omschrijving, met of zonder bedrag. Deze lijnen komen mee op de gegenereerde factuur."
    >
      <form onSubmit={(event) => void onAdd(event)} className="grid gap-3 sm:grid-cols-[1.6fr_0.7fr_auto]">
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Omschrijving, bv. extra parking of opbouw"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder="Bedrag (€, optioneel)"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Opslaan..." : "Lijn toevoegen"}
        </button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}

      {sponsor.extraLines.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Nog geen extra lijnen.</p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200">
          {sponsor.extraLines.map((line) => (
            <li key={line.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">{line.description}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {line.amount > 0 ? formatSponsorEuro(line.amount) : "Geen bedrag"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void removeExtraLine(sponsor.id, line.id)}
                className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-700"
                aria-label="Lijn verwijderen"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function InvoiceSection({
  sponsor,
  drinks,
  tickets,
  invoices,
}: {
  sponsor: Sponsor;
  drinks: SponsorBenefit[];
  tickets: SponsorBenefit[];
  invoices: SponsorInvoice[];
}) {
  const { generateInvoice } = useSponsors();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const draft = buildInvoiceDraft(sponsor, drinks, tickets);

  async function onGenerate() {
    setBusy(true);
    const result = await generateInvoice(sponsor.id);
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }

    setError(null);
    router.push(`/sponsoring/${sponsor.id}/facturen/${result.id}`);
  }

  const mailHref = draft.contact.email
    ? `mailto:${encodeURIComponent(draft.contact.email)}?subject=${encodeURIComponent(`Factuur Zeverrock ${sponsor.year} — ${sponsor.name}`)}`
    : "";

  return (
    <Section
      title="Factuur"
      description="Het sponsorbedrag, plus drankbonnen en vrijkaarten die op factuur staan, plus extra lijnen."
    >
      <div className="overflow-hidden rounded-xl border border-zinc-200">
        <ul className="divide-y divide-zinc-100">
          {draft.lines.map((line, index) => (
            <li key={`${line.kind}-${index}`} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
              <p className="text-zinc-800">{line.description}</p>
              <p className="shrink-0 font-medium text-zinc-900">
                {line.amount > 0 ? formatSponsorEuro(line.amount) : "—"}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-900">Totaal</p>
          <p className="text-sm font-semibold text-zinc-900">{formatSponsorEuro(draft.total)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
        <p className="font-medium text-zinc-900">Contactpersoon om te mailen</p>
        <p className="mt-1 text-zinc-600">
          {draft.contact.name || "Nog geen naam"} · {draft.contact.email || "Nog geen e-mail"}
        </p>
      </div>

      {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onGenerate()}
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {busy ? "Genereren..." : "Genereer factuur"}
        </button>
        {mailHref ? (
          <a
            href={mailHref}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
          >
            Mail contactpersoon
          </a>
        ) : null}
      </div>

      {invoices.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Gegenereerde facturen</h3>
          <ul className="mt-2 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link
                  href={`/sponsoring/${sponsor.id}/facturen/${invoice.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{invoice.invoiceNumber}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {sponsorInvoiceStatusLabel[invoice.status]} · {invoice.billedToName}
                    </p>
                  </div>
                  <p className="text-sm text-zinc-700">{formatSponsorEuro(invoice.amount)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}
