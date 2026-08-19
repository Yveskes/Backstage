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
  clearBuildAttendance,
  clearResponsibleIf,
  emptyPlanning,
  ensureTaskNeed,
  sanitizePlanning,
  setNeededCount,
  toggleBuildHalf,
  toggleResponsible,
  type StaffPlanning,
} from "@/lib/staff-planning";
import {
  defaultFestivalPosts,
  sanitizeFestivalPosts,
  setFestivalPostCatalog,
  uniquePostId,
  type FestivalPost,
  type StaffDayId,
  type BuildTaskId,
  type HalfDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";

const POSTS_KEY = "backstage.festivalPosts";

type ToggleResult = { ok: true } | { ok: false; holderId: string };

type StaffPlanningContextValue = {
  planning: StaffPlanning;
  posts: FestivalPost[];
  ready: boolean;
  setNeed: (taskId: StaffTaskId, day: string, value: number | null) => void;
  toggleLead: (taskId: StaffTaskId, userId: string) => ToggleResult;
  clearLeadIf: (taskId: StaffTaskId, userId: string) => void;
  toggleHalf: (kind: BuildTaskId, day: string, userId: string, half: HalfDayId) => void;
  clearAttendance: (userId: string, kind?: BuildTaskId, day?: string) => void;
  addPost: (input: { label: string; days: StaffDayId }) => FestivalPost | { error: string };
  updatePost: (id: string, patch: { label: string; days: StaffDayId }) => { error?: string };
};

const StaffPlanningContext = createContext<StaffPlanningContextValue | null>(null);

export function StaffPlanningProvider({ children }: { children: ReactNode }) {
  const [planning, setPlanning] = useState<StaffPlanning>(emptyPlanning);
  const [posts, setPosts] = useState<FestivalPost[]>(defaultFestivalPosts);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PLANNING_KEY);
      setPlanning(raw ? sanitizePlanning(JSON.parse(raw)) : emptyPlanning());
    } catch {
      setPlanning(emptyPlanning());
    }

    try {
      const rawPosts = window.localStorage.getItem(POSTS_KEY);
      const nextPosts = sanitizeFestivalPosts(rawPosts ? JSON.parse(rawPosts) : null);
      setPosts(nextPosts);
      setFestivalPostCatalog(nextPosts);
    } catch {
      setPosts(defaultFestivalPosts);
      setFestivalPostCatalog(defaultFestivalPosts);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(PLANNING_KEY, JSON.stringify(planning));
    window.localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    setFestivalPostCatalog(posts);
  }, [planning, posts, ready]);

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

  const toggleHalf = useCallback((kind: BuildTaskId, day: string, userId: string, half: HalfDayId) => {
    setPlanning((current) => toggleBuildHalf(current, kind, day, userId, half));
  }, []);

  const clearAttendance = useCallback((userId: string, kind?: BuildTaskId, day?: string) => {
    setPlanning((current) => clearBuildAttendance(current, userId, kind, day));
  }, []);

  const addPost = useCallback((input: { label: string; days: StaffDayId }) => {
    const label = input.label.trim();
    if (!label) {
      return { error: "Vul een naam in voor de post." };
    }

    const created: FestivalPost = {
      id: uniquePostId(label, posts),
      label,
      days: input.days,
    };
    setPosts((current) => [...current, created]);
    setPlanning((current) => ensureTaskNeed(current, created.id));
    return created;
  }, [posts]);

  const updatePost = useCallback((id: string, patch: { label: string; days: StaffDayId }) => {
    const label = patch.label.trim();
    if (!label) {
      return { error: "Vul een naam in voor de post." };
    }

    setPosts((current) =>
      current.map((post) => (post.id === id ? { ...post, label, days: patch.days } : post)),
    );
    return {};
  }, []);

  const value = useMemo(
    () => ({
      planning,
      posts,
      ready,
      setNeed,
      toggleLead,
      clearLeadIf,
      toggleHalf,
      clearAttendance,
      addPost,
      updatePost,
    }),
    [addPost, clearAttendance, clearLeadIf, planning, posts, ready, setNeed, toggleHalf, toggleLead, updatePost],
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
