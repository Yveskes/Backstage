"use client";

import { useUsers } from "@/components/users-provider";
import {
  formatTshirtSizes,
  getsTshirtPerFestivalDay,
  hasConfirmedTshirt,
  needsTshirt,
  tshirtSizes,
  type TshirtSize,
} from "@/lib/tshirts";
import { useEffect, useState } from "react";

function SizeButtons({
  selected,
  lastYear,
  onSelect,
}: {
  selected: TshirtSize | null;
  lastYear: TshirtSize | null;
  onSelect: (size: TshirtSize) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tshirtSizes.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onSelect(option)}
          className={`rounded px-3 py-1.5 text-sm ${
            selected === option
              ? "bg-zinc-900 text-white"
              : "border border-red-200 bg-white text-zinc-700"
          }`}
        >
          {option}
          {option === lastYear ? <span className="ml-1 text-[11px] opacity-70">vorig jaar</span> : null}
        </button>
      ))}
    </div>
  );
}

export function TshirtPicker() {
  const { currentUser, updateUser, confirmTshirt } = useUsers();
  const twoDays = getsTshirtPerFestivalDay(currentUser.days);
  const [size, setSize] = useState<TshirtSize | null>(currentUser.tshirtSize);
  const [saturdaySize, setSaturdaySize] = useState<TshirtSize | null>(currentUser.tshirtSizeSaturday);

  useEffect(() => {
    setSize(currentUser.tshirtSize);
    setSaturdaySize(currentUser.tshirtSizeSaturday);
  }, [currentUser.id, currentUser.tshirtSize, currentUser.tshirtSizeSaturday]);

  if (!needsTshirt(currentUser.kind)) {
    return null;
  }

  const selected = size ?? currentUser.tshirtSizeLastYear;
  const selectedSaturday = saturdaySize ?? selected ?? currentUser.tshirtSizeLastYear;
  const confirmed = hasConfirmedTshirt(currentUser);

  function confirm() {
    if (!selected) {
      return;
    }

    if (twoDays) {
      if (!selectedSaturday) {
        return;
      }

      confirmTshirt(currentUser.id, selected, selectedSaturday);
      return;
    }

    confirmTshirt(currentUser.id, selected);
  }

  return (
    <section
      className={`mb-6 rounded border p-5 ${
        confirmed ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            {twoDays ? "T-shirts" : "T-shirtmaat"}
          </h2>
          {confirmed ? (
            <p className="mt-1 text-sm text-emerald-900">Bevestigd: {formatTshirtSizes(currentUser)}</p>
          ) : currentUser.tshirtSizeLastYear ? (
            <p className="mt-1 text-sm text-red-800">
              Standaard staat de maat van vorig jaar ingevuld ({currentUser.tshirtSizeLastYear}).
            </p>
          ) : (
            <p className="mt-1 text-sm text-red-800">Kies je maat voor dit jaar.</p>
          )}
        </div>
        {confirmed ? (
          <p className="rounded bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Bevestigd · {formatTshirtSizes(currentUser)}
          </p>
        ) : (
          <p className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            Nog niet gekozen
          </p>
        )}
      </div>

      {confirmed ? (
        <p className="mt-3 text-sm text-emerald-900">
          Indien je toch nog een andere maat wil, laat het weten aan Yves.
        </p>
      ) : (
        <>
          <p className="mt-3 rounded border border-red-200 bg-white/70 px-3 py-2 text-sm text-red-900">
            {twoDays
              ? "Je helpt vrijdag én zaterdag, dus je krijgt een t-shirt per festivaldag. Opbouw en afbouw tellen niet mee. Je mag per dag een andere maat kiezen."
              : "Bevestig je t-shirtmaat. Zolang je dat niet doet, blijft deze melding staan dat je t-shirt nog niet gekozen is. Opbouw en afbouw geven geen extra t-shirt."}
          </p>

          {twoDays ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-900">Vrijdag</p>
                <SizeButtons
                  selected={selected}
                  lastYear={currentUser.tshirtSizeLastYear}
                  onSelect={(option) => {
                    setSize(option);
                    updateUser(currentUser.id, { tshirtSize: option });
                  }}
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-zinc-900">Zaterdag</p>
                <SizeButtons
                  selected={selectedSaturday}
                  lastYear={currentUser.tshirtSizeLastYear}
                  onSelect={(option) => {
                    setSaturdaySize(option);
                    updateUser(currentUser.id, { tshirtSizeSaturday: option });
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <SizeButtons
                selected={selected}
                lastYear={currentUser.tshirtSizeLastYear}
                onSelect={(option) => {
                  setSize(option);
                  updateUser(currentUser.id, { tshirtSize: option });
                }}
              />
            </div>
          )}

          <div className="mt-4">
            <button
              type="button"
              disabled={!selected || (twoDays && !selectedSaturday)}
              onClick={confirm}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {twoDays
                ? selected && selectedSaturday
                  ? `Bevestig ${selected === selectedSaturday ? `2× ${selected}` : `Vr ${selected} · Za ${selectedSaturday}`}`
                  : "Kies eerst beide maten"
                : selected
                  ? `Bevestig maat ${selected}`
                  : "Kies eerst een maat"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
