import Link from "next/link";
import type { ReactNode } from "react";
import {
  getSponsorName,
  mockDrinkVouchers,
  mockInvoices,
  mockTickets,
} from "@/lib/sponsors";

export function InvoiceTable({ sponsorId }: { sponsorId?: string }) {
  const invoices = sponsorId
    ? mockInvoices.filter((invoice) => invoice.sponsorId === sponsorId)
    : mockInvoices;

  return (
    <DataTable
      empty="Nog geen facturen."
      headers={sponsorId ? ["Nummer", "Bedrag", "Status"] : ["Nummer", "Sponsor", "Bedrag", "Status"]}
      rows={invoices.map((invoice) => [
        invoice.invoiceNumber,
        ...(sponsorId
          ? []
          : [
              <Link
                key={invoice.id}
                href={`/sponsoring/${invoice.sponsorId}/facturen`}
                className="hover:underline"
              >
                {getSponsorName(invoice.sponsorId)}
              </Link>,
            ]),
        `€ ${invoice.amount.toLocaleString("nl-BE")}`,
        invoice.status,
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
  const items = (type === "drankbonnen" ? mockDrinkVouchers : mockTickets).filter((item) =>
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
                {getSponsorName(item.sponsorId)}
              </Link>,
            ]),
        String(item.quantity),
        item.status,
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
