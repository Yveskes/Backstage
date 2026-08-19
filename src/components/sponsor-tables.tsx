"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSponsors } from "@/components/sponsors-provider";
import {
  formatSponsorEuro,
  sponsorBenefitStatusLabel,
  sponsorInvoiceStatusLabel,
} from "@/lib/sponsors";

export function InvoiceTable({ sponsorId }: { sponsorId?: string }) {
  const { invoices, sponsors } = useSponsors();
  const rows = sponsorId ? invoices.filter((invoice) => invoice.sponsorId === sponsorId) : invoices;

  return (
    <DataTable
      empty="Nog geen facturen."
      headers={sponsorId ? ["Nummer", "Bedrag", "Status"] : ["Nummer", "Sponsor", "Bedrag", "Status"]}
      rows={rows.map((invoice) => [
        <Link
          key={invoice.id}
          href={`/sponsoring/${invoice.sponsorId}/facturen/${invoice.id}`}
          className="hover:underline"
        >
          {invoice.invoiceNumber}
        </Link>,
        ...(sponsorId
          ? []
          : [
              <Link
                key={`${invoice.id}-sponsor`}
                href={`/sponsoring/${invoice.sponsorId}/facturen`}
                className="hover:underline"
              >
                {sponsors.find((sponsor) => sponsor.id === invoice.sponsorId)?.name ?? "Onbekende sponsor"}
              </Link>,
            ]),
        formatSponsorEuro(invoice.amount),
        sponsorInvoiceStatusLabel[invoice.status],
      ])}
    />
  );
}

export function BenefitTable({
  sponsorId,
  type,
}: {
  sponsorId?: string;
  type: "drankbonnen" | "vrijkaarten";
}) {
  const { drinkVouchers, tickets, sponsors } = useSponsors();
  const items = (type === "drankbonnen" ? drinkVouchers : tickets).filter((item) =>
    sponsorId ? item.sponsorId === sponsorId : true,
  );

  return (
    <DataTable
      empty={type === "drankbonnen" ? "Nog geen drankbonnen." : "Nog geen vrijkaarten."}
      headers={sponsorId ? ["Ontvanger", "Aantal", "Status"] : ["Ontvanger", "Sponsor", "Aantal", "Status"]}
      rows={items.map((item) => [
        item.recipientName,
        ...(sponsorId
          ? []
          : [
              <Link
                key={item.id}
                href={`/sponsoring/${item.sponsorId}/${type}`}
                className="hover:underline"
              >
                {sponsors.find((sponsor) => sponsor.id === item.sponsorId)?.name ?? "Onbekende sponsor"}
              </Link>,
            ]),
        String(item.quantity),
        sponsorBenefitStatusLabel[item.status],
      ])}
    />
  );
}

function DataTable({
  headers,
  rows,
  empty,
}: {
  headers: string[];
  rows: Array<Array<ReactNode>>;
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-zinc-100 last:border-0">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`px-4 py-3 ${cellIndex === 0 ? "font-medium text-zinc-900" : "text-zinc-600"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
