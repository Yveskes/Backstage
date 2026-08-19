"use client";

import { TrashIcon } from "@/components/icons";
import { useSponsors } from "@/components/sponsors-provider";
import {
  benefitLineAmount,
  formatSponsorEuro,
  parseEuroAmount,
  sponsorBenefitStatusLabel,
  type SponsorBenefit,
} from "@/lib/sponsors";
import { useState, type FormEvent } from "react";

const fieldClass =
  "rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400";

export function SponsorBenefitsEditor({
  sponsorId,
  type,
  compact,
}: {
  sponsorId: string;
  type: "drankbonnen" | "vrijkaarten";
  compact?: boolean;
}) {
  const { drinkVouchers, tickets, addBenefit, updateBenefit, removeBenefit, getSponsor } = useSponsors();
  const sponsor = getSponsor(sponsorId);
  const items = (type === "drankbonnen" ? drinkVouchers : tickets).filter((item) => item.sponsorId === sponsorId);
  const [recipientName, setRecipientName] = useState(sponsor?.name ?? "");
  const [quantity, setQuantity] = useState("10");
  const [unitPrice, setUnitPrice] = useState(type === "drankbonnen" ? "2" : "25");
  const [onInvoice, setOnInvoice] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const title = type === "drankbonnen" ? "Drankbonnen" : "Vrijkaarten";
  const description =
    type === "drankbonnen"
      ? "Voeg drankbonnen toe. Zet ‘op factuur’ aan als ze mee gefactureerd moeten worden."
      : "Voeg vrijkaarten toe. Zet ‘op factuur’ aan als ze mee gefactureerd moeten worden.";

  function onAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qty = Number(quantity);
    const price = parseEuroAmount(unitPrice, { allowEmpty: true });
    if (!Number.isFinite(qty) || qty < 1) {
      setError("Vul een geldig aantal in.");
      return;
    }
    if (price === null) {
      setError("Vul een geldige stukprijs in, of laat leeg.");
      return;
    }

    addBenefit(type, {
      sponsorId,
      recipientName: recipientName.trim() || sponsor?.name || "Ontvanger",
      quantity: Math.round(qty),
      unitPrice: price,
      onInvoice,
    });
    setError(null);
    setQuantity("10");
  }

  return (
    <div>
      {compact ? null : (
        <>
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{description}</p>
        </>
      )}

      <form
        onSubmit={onAdd}
        className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.6fr_0.7fr_auto] ${compact ? "" : "mt-5"}`}
      >
        <input
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
          placeholder="Voor wie"
          className={fieldClass}
        />
        <input
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          inputMode="numeric"
          placeholder="Aantal"
          className={fieldClass}
        />
        <input
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          inputMode="decimal"
          placeholder="Stukprijs (€)"
          className={fieldClass}
        />
        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          Toevoegen
        </button>
        <label className="flex items-center gap-2 text-sm text-zinc-700 sm:col-span-2 lg:col-span-4">
          <input
            type="checkbox"
            checked={onInvoice}
            onChange={(event) => setOnInvoice(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Op factuur zetten
        </label>
      </form>

      {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">Nog geen {title.toLowerCase()}.</p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200">
          {items.map((item) => (
            <BenefitRow
              key={item.id}
              item={item}
              type={type}
              onToggleInvoice={(checked) => updateBenefit(type, item.id, { onInvoice: checked })}
              onRemove={() => removeBenefit(type, item.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function BenefitRow({
  item,
  type,
  onToggleInvoice,
  onRemove,
}: {
  item: SponsorBenefit;
  type: "drankbonnen" | "vrijkaarten";
  onToggleInvoice: (checked: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900">{item.recipientName}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {item.quantity} st. · {formatSponsorEuro(item.unitPrice)} / st. · {sponsorBenefitStatusLabel[item.status]}
          {item.onInvoice ? ` · ${formatSponsorEuro(benefitLineAmount(item))} op factuur` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          <input
            type="checkbox"
            checked={item.onInvoice}
            onChange={(event) => onToggleInvoice(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
          Op factuur
        </label>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-700"
          aria-label={`${type} verwijderen`}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
