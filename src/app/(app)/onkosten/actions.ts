"use server";

import { fetchExpenseClaims, insertExpenseClaim, updateExpenseStatus } from "@/lib/expense-store";
import type { ExpenseClaim, ExpenseStatus } from "@/lib/expenses";

export async function loadExpenseClaims(): Promise<ExpenseClaim[]> {
  return fetchExpenseClaims();
}

export async function saveExpenseClaim(claim: ExpenseClaim): Promise<ExpenseClaim> {
  return insertExpenseClaim(claim);
}

export async function saveExpenseStatus(id: string, status: ExpenseStatus): Promise<void> {
  await updateExpenseStatus(id, status);
}
