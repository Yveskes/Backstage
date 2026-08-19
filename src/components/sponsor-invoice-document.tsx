"use client";

import { useSponsors } from "@/components/sponsors-provider";
import {
  billingAddress,
  formatSponsorEuro,
  sponsorInvoiceStatusLabel,
  type SponsorInvoiceStatus,
} from "@/lib/sponsors";
import Link from "next/link";

export function SponsorInvoiceDocument({
  sponsorId,
  invoiceId,
}: {
  sponsorId: string;
  invoiceId: string;
}) {
  const { getSponsor, invoices, setInvoiceStatus } = useSponsors();
  const sponsor = getSponsor(sponsorId);
  const invoice = invoices.find((item) => item.id === invoiceId && item.sponsorId === sponsorId);

  if (!sponsor || !invoice) {
    return <p className="text-sm text-zinc-500">Deze factuur bestaat niet.</p>;
  }

  const billedOn = new Date(invoice.createdAt);
  const dateLabel = Number.isNaN(billedOn.getTime())
    ? invoice.createdAt
    : billedOn.toLocaleDateString("nl-BE", { day: "numeric", month: "long", year: "numeric" });

  const mailBody = [
    `Beste ${invoice.billedToName || "contact"},`,
    "",
    `In bijlage / hieronder factuur ${invoice.invoiceNumber} voor ${sponsor.name}.`,
    `Totaal: ${formatSponsorEuro(invoice.amount)}.`,
    "",
    ...invoice.lines.map((line) => `- ${line.description}: ${formatSponsorEuro(line.amount)}`),
    "",
    "Met vriendelijke groeten",
    "Zeverrock",
  ].join("\n");

  const mailHref = invoice.billedToEmail
    ? `mailto:${encodeURIComponent(invoice.billedToEmail)}?subject=${encodeURIComponent(`Factuur ${invoice.invoiceNumber} — Zeverrock`)}&body=${encodeURIComponent(mailBody)}`
    : "";

  return (
    <div>
      <div className="mb-6 print:hidden">
        <p className="text-sm text-zinc-500">
          <Link href={`/sponsoring/${sponsorId}`} className="hover:text-zinc-800">
            {sponsor.name}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/sponsoring/${sponsorId}/facturen`} className="hover:text-zinc-800">
            Facturen
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-800">{invoice.invoiceNumber}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          >
            Afdrukken / PDF
          </button>
          {mailHref ? (
            <a
              href={mailHref}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50"
            >
              Mail naar {invoice.billedToName || invoice.billedToEmail}
            </a>
          ) : null}
          <label className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
            Status
            <select
              value={invoice.status}
              onChange={(event) => setInvoiceStatus(invoice.id, event.target.value as SponsorInvoiceStatus)}
              className="bg-transparent text-sm outline-none"
            >
              <option value="draft">Concept</option>
              <option value="sent">Verzonden</option>
              <option value="paid">Betaald</option>
            </select>
          </label>
        </div>
      </div>

      <article className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-10 print:border-0 print:p-0">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Factuur</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">{invoice.invoiceNumber}</h1>
            <p className="mt-1 text-sm text-zinc-500">{dateLabel}</p>
            <p className="mt-2 text-sm text-zinc-600">{sponsorInvoiceStatusLabel[invoice.status]}</p>
          </div>
          <div className="text-sm text-zinc-600">
            <p className="font-semibold text-zinc-900">Zeverrock</p>
            <p>vzw Zeverrock</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-zinc-200 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Factureren aan</p>
            <p className="mt-2 font-medium text-zinc-900">{sponsor.billing.companyName || sponsor.name}</p>
            {sponsor.billing.vatNumber ? <p className="text-sm text-zinc-600">{sponsor.billing.vatNumber}</p> : null}
            {billingAddress(sponsor.billing) ? (
              <p className="text-sm text-zinc-600">{billingAddress(sponsor.billing)}</p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Contactpersoon</p>
            <p className="mt-2 font-medium text-zinc-900">{invoice.billedToName || "—"}</p>
            <p className="text-sm text-zinc-600">{invoice.billedToEmail || "—"}</p>
          </div>
        </div>

        <table className="mt-8 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-500">
              <th className="py-2 font-medium">Omschrijving</th>
              <th className="py-2 text-right font-medium">Bedrag</th>
            </tr>
          </thead>
          <tbody>
            {invoice.lines.map((line) => (
              <tr key={line.id} className="border-b border-zinc-100">
                <td className="py-3 text-zinc-800">{line.description}</td>
                <td className="py-3 text-right text-zinc-900">
                  {line.amount > 0 ? formatSponsorEuro(line.amount) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-4 font-semibold text-zinc-900">Totaal</td>
              <td className="pt-4 text-right font-semibold text-zinc-900">{formatSponsorEuro(invoice.amount)}</td>
            </tr>
          </tfoot>
        </table>
      </article>
    </div>
  );
}
