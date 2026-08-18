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
import {
  PLANNING_KEY,
  clearResponsibleIf,
  emptyPlanning,
  sanitizePlanning,
  setNeededCount,
  toggleResponsible,
  type StaffPlanning,
} from "@/lib/staff-planning";
import type { StaffTaskId } from "@/lib/staff-tasks";

type ToggleResult = { ok: true } | { ok: false; holderId: string };

type StaffPlanningContextValue = {
  planning: StaffPlanning;
  ready: boolean;
  setNeed: (taskId: StaffTaskId, day: string, value: number | null) => void;
  toggleLead: (taskId: StaffTaskId, userId: string) => ToggleResult;
  clearLeadIf: (taskId: StaffTaskId, userId: string) => void;
};

const StaffPlanningContext = createContext<StaffPlanningContextValue | null>(null);

export function StaffPlanningProvider({ children }: { children: ReactNode }) {
  const [planning, setPlanning] = useState<StaffPlanning>(emptyPlanning);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLANNING_KEY);
      setPlanning(raw ? sanitizePlanning(JSON.parse(raw)) : emptyPlanning());
    } catch {
      setPlanning(emptyPlanning());
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(PLANNING_KEY, JSON.stringify(planning));
  }, [planning, ready]);

  const setNeed = useCallback((taskId: StaffTaskId, day: string, value: number | null) => {
    setPlanning((current) => setNeededCount(current, taskId, day, value));
  }, []);

  const toggleLead = useCallback(
    (taskId: StaffTaskId, userId: string): ToggleResult => {
      const next = toggleResponsible(planning, taskId, userId);
      if (!next.ok) {
        return { ok: false, holderId: next.holderId };
      }

      setPlanning(next.planning);
      return { ok: true };
    },
    [planning],
  );

  const clearLeadIf = useCallback((taskId: StaffTaskId, userId: string) => {
    setPlanning((current) => clearResponsibleIf(current, taskId, userId));
  }, []);

  const value = useMemo(
    () => ({ planning, ready, setNeed, toggleLead, clearLeadIf }),
    [clearLeadIf, planning, ready, setNeed, toggleLead],
  );

  return <StaffPlanningContext.Provider value={value}>{children}</StaffPlanningContext.Provider>;
}

export function useStaffPlanning() {
  const context = useContext(StaffPlanningContext);
  if (!context) {
    throw new Error("useStaffPlanning must be used within StaffPlanningProvider");
  }

  return context;
}
