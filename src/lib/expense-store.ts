import { createAdminClient } from "@/lib/supabase/admin";
import { sanitizeExpenseClaims, type ExpenseClaim, type ExpenseStatus } from "@/lib/expenses";

function rowToClaim(row: Record<string, unknown>): ExpenseClaim | null {
  return (
    sanitizeExpenseClaims([
      {
        id: row.id,
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        title: row.title,
        amountCents: row.amount_cents,
        note: row.note,
        date: row.expense_date,
        status: row.status,
        createdAt: row.created_at,
      },
    ])[0] ?? null
  );
}

export async function fetchExpenseClaims(): Promise<ExpenseClaim[]> {
  const admin = createAdminClient();
  if (!admin) {
    return [];
  }

  const { data, error } = await admin
    .from("expense_claims")
    .select("id, user_id, user_name, user_email, title, amount_cents, note, expense_date, status, created_at")
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => rowToClaim(row as Record<string, unknown>))
    .filter((claim): claim is ExpenseClaim => claim !== null);
}

export async function insertExpenseClaim(claim: ExpenseClaim): Promise<ExpenseClaim> {
  const admin = createAdminClient();
  if (!admin) {
    return claim;
  }

  await admin.from("expense_claims").upsert({
    id: claim.id,
    user_id: claim.userId,
    user_name: claim.userName,
    user_email: claim.userEmail,
    title: claim.title,
    amount_cents: claim.amountCents,
    note: claim.note,
    expense_date: claim.date,
    status: claim.status,
    created_at: claim.createdAt,
  });

  return claim;
}

export async function updateExpenseStatus(id: string, status: ExpenseStatus): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  await admin.from("expense_claims").update({ status }).eq("id", id);
}
