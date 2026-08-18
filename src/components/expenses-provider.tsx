"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { loadExpenseClaims, saveExpenseClaim, saveExpenseStatus } from "@/app/(app)/onkosten/actions";
import { sanitizeExpenseClaims, type ExpenseClaim, type ExpenseStatus } from "@/lib/expenses";
import { canAssignRoles, canClaimExpenses } from "@/lib/permissions";
import { useUsers } from "@/components/users-provider";

const EXPENSES_KEY = "backstage.expenseClaims";

type ExpensesContextValue = {
  expenses: ExpenseClaim[];
  addExpense: (input: { title: string; amountCents: number; date: string; note: string }) => void;
  setExpenseStatus: (id: string, status: ExpenseStatus) => void;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUsers();
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EXPENSES_KEY);
      setExpenses(raw ? sanitizeExpenseClaims(JSON.parse(raw)) : []);
    } catch {
      setExpenses([]);
    }

    setReady(true);

    void loadExpenseClaims()
      .then((remote) => {
        if (remote.length === 0) {
          return;
        }

        setExpenses((current) => {
          const byId = new Map(current.map((item) => [item.id, item]));
          for (const item of remote) {
            byId.set(item.id, item);
          }
          return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        });
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
  }, [expenses, ready]);

  const addExpense = useCallback(
    (input: { title: string; amountCents: number; date: string; note: string }) => {
      if (!canClaimExpenses(currentUser)) {
        return;
      }

      const claim: ExpenseClaim = {
        id: crypto.randomUUID(),
        userId: currentUser.id,
        userName: currentUser.fullName || currentUser.email,
        userEmail: currentUser.email,
        title: input.title.trim(),
        amountCents: input.amountCents,
        note: input.note.trim(),
        date: input.date,
        status: "submitted",
        createdAt: new Date().toISOString(),
      };

      setExpenses((current) => [claim, ...current]);
      void saveExpenseClaim(claim);
    },
    [currentUser],
  );

  const setExpenseStatus = useCallback(
    (id: string, status: ExpenseStatus) => {
      if (!canAssignRoles(currentUser)) {
        return;
      }

      setExpenses((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      void saveExpenseStatus(id, status);
    },
    [currentUser],
  );

  const value = useMemo(
    () => ({ expenses, addExpense, setExpenseStatus }),
    [addExpense, expenses, setExpenseStatus],
  );

  return <ExpensesContext.Provider value={value}>{children}</ExpensesContext.Provider>;
}

export function useExpenses() {
  const context = useContext(ExpensesContext);
  if (!context) {
    throw new Error("useExpenses must be used within ExpensesProvider");
  }

  return context;
}
