"use client";

import { useExpenses } from "@/components/expenses-provider";
import { useUsers } from "@/components/users-provider";
import {
  expenseStatusLabel,
  formatEuro,
  parseEuroInput,
  type ExpenseClaim,
  type ExpenseStatus,
} from "@/lib/expenses";
import { canAssignRoles, canClaimExpenses } from "@/lib/permissions";
import { useState, type FormEvent } from "react";

function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("nl-BE", { day: "numeric", month: "short", year: "numeric" });
}

const statusClass: Record<ExpenseStatus, string> = {
  submitted: "text-amber-800",
  paid: "text-emerald-800",
  rejected: "text-red-800",
};

function ExpenseRow({
  claim,
  canManage,
  onStatus,
}: {
  claim: ExpenseClaim;
  canManage: boolean;
  onStatus: (id: string, status: ExpenseStatus) => void;
}) {
  return (
    <li className="rounded border border-zinc-200 bg-white px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-900">{claim.title}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {claim.userName} · {formatDate(claim.date)}
          </p>
          {claim.note ? <p className="mt-1 text-sm text-zinc-600">{claim.note}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-zinc-900">{formatEuro(claim.amountCents)}</p>
          <p className={`mt-0.5 text-xs ${statusClass[claim.status]}`}>{expenseStatusLabel[claim.status]}</p>
        </div>
      </div>
      {canManage && claim.status === "submitted" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onStatus(claim.id, "paid")}
            className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
          >
            Uitbetalen
          </button>
          <button
            type="button"
            onClick={() => onStatus(claim.id, "rejected")}
            className="rounded border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700"
          >
            Afwijzen
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function ExpenseClaims() {
  const { currentUser } = useUsers();
  const { expenses, addExpense, setExpenseStatus } = useExpenses();
  const canSubmit = canClaimExpenses(currentUser);
  const canManage = canAssignRoles(currentUser);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIsoDate);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!canSubmit) {
    return null;
  }

  const mine = expenses.filter((item) => item.userId === currentUser.id || item.userEmail === currentUser.email);
  const others = canManage
    ? expenses.filter((item) => item.userId !== currentUser.id && item.userEmail !== currentUser.email)
    : [];

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amountCents = parseEuroInput(amount);
    if (!title.trim() || !amountCents) {
      setError("Vul een omschrijving en een bedrag in.");
      return;
    }

    addExpense({ title, amountCents, date, note });
    setTitle("");
    setAmount("");
    setDate(todayIsoDate());
    setNote("");
    setError(null);
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-zinc-900">Onkosten indienen</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Kocht je iets voor Zeverrock, of ging er materiaal verloren? Dien het hier in, bijvoorbeeld inkt voor de
        printer of een zoekgeraakte boormachine. Alles moet op factuur gekocht worden met de kaart van Zeverrock, en
        eerst gevraagd worden aan de financieel verantwoordelijke.
      </p>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.9fr_auto]">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Inkt voor printer"
          required
          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <input
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder="Bedrag (€)"
          required
          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          required
          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <button type="submit" className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          Indienen
        </button>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Toelichting (optioneel), bv. zoekgeraakte boormachine"
          rows={2}
          className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 sm:col-span-2 lg:col-span-4"
        />
      </form>

      {error ? <p className="mt-3 text-sm text-red-800">{error}</p> : null}

      <div className="mt-5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Mijn onkosten</h3>
        {mine.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Nog niets ingediend.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {mine.map((claim) => (
              <ExpenseRow key={claim.id} claim={claim} canManage={canManage} onStatus={setExpenseStatus} />
            ))}
          </ul>
        )}
      </div>

      {canManage && others.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Van het team</h3>
          <ul className="mt-2 space-y-2">
            {others.map((claim) => (
              <ExpenseRow key={claim.id} claim={claim} canManage onStatus={setExpenseStatus} />
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
