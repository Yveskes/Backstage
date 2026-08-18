export const expenseStatuses = ["submitted", "paid", "rejected"] as const;
export type ExpenseStatus = (typeof expenseStatuses)[number];

export type ExpenseClaim = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  amountCents: number;
  note: string;
  date: string;
  status: ExpenseStatus;
  createdAt: string;
};

export const expenseStatusLabel: Record<ExpenseStatus, string> = {
  submitted: "Ingediend",
  paid: "Uitbetaald",
  rejected: "Afgewezen",
};

export function formatEuro(amountCents: number) {
  return new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
  }).format(amountCents / 100);
}

export function parseEuroInput(raw: string) {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return Math.round(value * 100);
}

function isExpenseStatus(value: unknown): value is ExpenseStatus {
  return expenseStatuses.includes(value as ExpenseStatus);
}

export function sanitizeExpenseClaims(raw: unknown): ExpenseClaim[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const claims: ExpenseClaim[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const data = entry as Partial<ExpenseClaim>;
    if (!data.id || !data.userId || !data.title || !data.date || !data.createdAt) {
      continue;
    }

    const amountCents = Number(data.amountCents);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      continue;
    }

    claims.push({
      id: String(data.id),
      userId: String(data.userId),
      userName: String(data.userName ?? "Iemand"),
      userEmail: String(data.userEmail ?? "").toLowerCase(),
      title: String(data.title).trim(),
      amountCents: Math.round(amountCents),
      note: typeof data.note === "string" ? data.note.trim() : "",
      date: String(data.date),
      status: isExpenseStatus(data.status) ? data.status : "submitted",
      createdAt: String(data.createdAt),
    });
  }

  return claims.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
