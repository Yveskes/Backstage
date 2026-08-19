import {
  afbouwDayIds,
  festivalTaskIds,
  halfDayIds,
  isBuildTask,
  isOpbouwDayId,
  isAfbouwDayId,
  opbouwDayIds,
  staffTaskIds,
  type AfbouwDayId,
  type BuildTaskId,
  type HalfDayId,
  type OpbouwDayId,
  type PlanningDayId,
  type StaffTaskId,
} from "@/lib/staff-tasks";

export type NeedMap = Record<string, number | null>;

export type StaffPlanning = {
  needed: Record<StaffTaskId, NeedMap>;
  responsible: Partial<Record<StaffTaskId, string>>;
  attendance: Record<string, HalfDayId[]>;
};

export const PLANNING_KEY = "backstage.staffPlanning";

export function daysForTask(taskId: StaffTaskId): { id: string; label: string }[] {
  if (taskId === "opbouw") {
    return [
      { id: "monday", label: "Maandag" },
      { id: "tuesday", label: "Dinsdag" },
      { id: "wednesday", label: "Woensdag" },
      { id: "thursday", label: "Donderdag" },
      { id: "friday", label: "Vrijdag" },
    ];
  }

  if (taskId === "afbouw") {
    return [
      { id: "sunday", label: "Zondag" },
      { id: "monday", label: "Maandag" },
      { id: "tuesday", label: "Dinsdag" },
      { id: "wednesday", label: "Woensdag" },
    ];
  }

  return [
    { id: "friday", label: "Vrijdag" },
    { id: "saturday", label: "Zaterdag" },
  ];
}

function emptyNeed(taskId: StaffTaskId): NeedMap {
  return Object.fromEntries(daysForTask(taskId).map((day) => [day.id, null]));
}

export function emptyPlanning(): StaffPlanning {
  return {
    needed: Object.fromEntries(staffTaskIds.map((id) => [id, emptyNeed(id)])) as Record<
      StaffTaskId,
      NeedMap
    >,
    responsible: {},
    attendance: {},
  };
}

function sanitizeCount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const count = Number(value);
  if (!Number.isFinite(count) || count < 0) {
    return null;
  }

  return Math.round(count);
}

function allowedDayIds(taskId: StaffTaskId): readonly string[] {
  if (taskId === "opbouw") {
    return opbouwDayIds;
  }

  if (taskId === "afbouw") {
    return afbouwDayIds;
  }

  return ["friday", "saturday"];
}

export function sanitizePlanning(raw: unknown): StaffPlanning {
  const planning = emptyPlanning();
  if (!raw || typeof raw !== "object") {
    return planning;
  }

  const data = raw as Partial<StaffPlanning>;

  for (const taskId of staffTaskIds) {
    const need = data.needed?.[taskId] ?? {};
    const allowed = allowedDayIds(taskId);
    planning.needed[taskId] = Object.fromEntries(
      allowed.map((dayId) => [dayId, sanitizeCount(need[dayId])]),
    );
  }

  if (data.responsible && typeof data.responsible === "object") {
    for (const taskId of staffTaskIds) {
      const userId = data.responsible[taskId];
      if (typeof userId === "string" && userId.trim()) {
        planning.responsible[taskId] = userId;
      }
    }
  }

  planning.attendance = sanitizeAttendance(data.attendance);

  return planning;
}

export function attendanceKey(kind: BuildTaskId, day: string, userId: string) {
  return `${kind}:${day}:${userId}`;
}

function parseAttendanceKey(key: string) {
  const [kind, day, ...rest] = key.split(":");
  const userId = rest.join(":");
  if (!isBuildTask(kind) || !userId) {
    return null;
  }

  if (kind === "opbouw" && !isOpbouwDayId(day)) {
    return null;
  }

  if (kind === "afbouw" && !isAfbouwDayId(day)) {
    return null;
  }

  return { kind, day, userId };
}

function sanitizeHalves(raw: unknown): HalfDayId[] {
  const values = Array.isArray(raw) ? raw : [];
  return halfDayIds.filter((id) => values.includes(id));
}

function sanitizeAttendance(raw: unknown): Record<string, HalfDayId[]> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const attendance: Record<string, HalfDayId[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const parsed = parseAttendanceKey(key);
    const halves = sanitizeHalves(value);
    if (!parsed || halves.length === 0) {
      continue;
    }

    attendance[attendanceKey(parsed.kind, parsed.day, parsed.userId)] = halves;
  }

  return attendance;
}

export function halvesFor(
  planning: StaffPlanning,
  kind: BuildTaskId,
  day: string,
  userId: string,
): HalfDayId[] {
  return sanitizeHalves(planning.attendance[attendanceKey(kind, day, userId)]);
}

export function toggleBuildHalf(
  planning: StaffPlanning,
  kind: BuildTaskId,
  day: string,
  userId: string,
  half: HalfDayId,
): StaffPlanning {
  const key = attendanceKey(kind, day, userId);
  const current = halvesFor(planning, kind, day, userId);
  const next = current.includes(half) ? current.filter((entry) => entry !== half) : [...current, half];
  const attendance = { ...planning.attendance };

  if (next.length === 0) {
    delete attendance[key];
  } else {
    attendance[key] = sanitizeHalves(next);
  }

  return { ...planning, attendance };
}

export function clearBuildAttendance(
  planning: StaffPlanning,
  userId: string,
  kind?: BuildTaskId,
  day?: string,
): StaffPlanning {
  const attendance = { ...planning.attendance };

  for (const key of Object.keys(attendance)) {
    const parsed = parseAttendanceKey(key);
    if (!parsed || parsed.userId !== userId) {
      continue;
    }

    if (kind && parsed.kind !== kind) {
      continue;
    }

    if (day && parsed.day !== day) {
      continue;
    }

    delete attendance[key];
  }

  return { ...planning, attendance };
}

export function isPostUnderfilled(needed: number | null, assigned: number) {
  return needed === null || assigned < needed;
}

export function isPostComplete(needed: number | null, assigned: number) {
  return needed !== null && assigned >= needed;
}

export function formatFill(needed: number | null, assigned: number) {
  if (needed === null) {
    return `${assigned} / —`;
  }

  return `${assigned} / ${needed}`;
}

export function setNeededCount(
  planning: StaffPlanning,
  taskId: StaffTaskId,
  day: string,
  value: number | null,
): StaffPlanning {
  return {
    ...planning,
    needed: {
      ...planning.needed,
      [taskId]: {
        ...planning.needed[taskId],
        [day]: value,
      },
    },
  };
}

export function setResponsible(
  planning: StaffPlanning,
  taskId: StaffTaskId,
  userId: string | null,
): StaffPlanning {
  const responsible = { ...planning.responsible };
  if (!userId) {
    delete responsible[taskId];
  } else {
    responsible[taskId] = userId;
  }

  return { ...planning, responsible };
}

export function toggleResponsible(
  planning: StaffPlanning,
  taskId: StaffTaskId,
  userId: string,
): { ok: true; planning: StaffPlanning } | { ok: false; holderId: string } {
  const current = planning.responsible[taskId];

  if (!current || current === userId) {
    return {
      ok: true,
      planning: setResponsible(planning, taskId, current === userId ? null : userId),
    };
  }

  return { ok: false, holderId: current };
}

export function clearResponsibleIf(
  planning: StaffPlanning,
  taskId: StaffTaskId,
  userId: string,
): StaffPlanning {
  if (planning.responsible[taskId] !== userId) {
    return planning;
  }

  return setResponsible(planning, taskId, null);
}

export function leadsForUser(planning: StaffPlanning, userId: string): StaffTaskId[] {
  return festivalTaskIds.filter((taskId) => planning.responsible[taskId] === userId);
}

export function attendanceEntriesForUser(planning: StaffPlanning, userId: string): HalfDayId[][] {
  const entries: HalfDayId[][] = [];

  for (const key of Object.keys(planning.attendance)) {
    const parsed = parseAttendanceKey(key);
    if (!parsed || parsed.userId !== userId) {
      continue;
    }

    entries.push(halvesFor(planning, parsed.kind, parsed.day, parsed.userId));
  }

  return entries;
}

export type { OpbouwDayId, AfbouwDayId, PlanningDayId };
