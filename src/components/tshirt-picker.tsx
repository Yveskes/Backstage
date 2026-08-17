"use client";

import { useUsers } from "@/components/users-provider";
import { needsTshirt, tshirtSizes, type TshirtSize } from "@/lib/tshirts";
import { useEffect, useState } from "react";

export function TshirtPicker() {
  const { currentUser, updateUser, confirmTshirt } = useUsers();
  const [size, setSize] = useState<TshirtSize | null>(currentUser.tshirtSize);

  useEffect(() => {
    setSize(currentUser.tshirtSize);
  }, [currentUser.id, currentUser.tshirtSize]);

  if (!needsTshirt(currentUser.kind)) {
    return null;
  }

  const selected = size ?? currentUser.tshirtSizeLastYear;
  const confirmed = currentUser.tshirtConfirmed;

  function confirm() {
    if (!selected) {
      return;
    }

    confirmTshirt(currentUser.id, selected);
  }

  return (
    <section
      className={`mb-6 rounded border p-5 ${
        confirmed
          ? "border-emerald-200 bg-emerald-50"
          : "border-red-200 bg-red-50"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">T-shirtmaat</h2>
          {confirmed ? (
            <p className="mt-1 text-sm text-emerald-900">
              Bevestigd: {currentUser.tshirtSize}
            </p>
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
            Bevestigd · {currentUser.tshirtSize}
          </p>
        ) : (
          <p className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            Nog niet gekozen
          </p>
        )}
      </div>

      {confirmed ? (
        <p className="mt-3 text-sm text-emerald-900">
          Indien je toch nog een andere maat wil,{" "}
          <a href="#chat" className="font-medium underline underline-offset-2">
            stuur een bericht
          </a>
          .
        </p>
      ) : (
        <>
          <p className="mt-3 rounded border border-red-200 bg-white/70 px-3 py-2 text-sm text-red-900">
            Bevestig je t-shirtmaat. Zolang je dat niet doet, blijft deze melding staan dat je
            t-shirt nog niet gekozen is.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {tshirtSizes.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSize(option);
                  updateUser(currentUser.id, { tshirtSize: option });
                }}
                className={`rounded px-3 py-1.5 text-sm ${
                  selected === option
                    ? "bg-zinc-900 text-white"
                    : "border border-red-200 bg-white text-zinc-700"
                }`}
              >
                {option}
                {option === currentUser.tshirtSizeLastYear ? (
                  <span className="ml-1 text-[11px] opacity-70">vorig jaar</span>
                ) : null}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <button
              type="button"
              disabled={!selected}
              onClick={confirm}
              className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {selected ? `Bevestig maat ${selected}` : "Kies eerst een maat"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
