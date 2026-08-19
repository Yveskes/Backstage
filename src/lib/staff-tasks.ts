export const staffTaskIds = [
  "opbouw",
  "afbouw",
  "toog-a",
  "toog-b",
  "kassawagen",
  "runner",
  "ingang",
] as const;

export type StaffTaskId = (typeof staffTaskIds)[number];

export const festivalTaskIds = ["toog-a", "toog-b", "kassawagen", "runner", "ingang"] as const;
export type FestivalTaskId = (typeof festivalTaskIds)[number];

export const staffTaskOptions: { id: StaffTaskId; label: string }[] = [
  { id: "opbouw", label: "Opbouw" },
  { id: "afbouw", label: "Afbouw" },
  { id: "toog-a", label: "Toog A" },
  { id: "toog-b", label: "Toog B" },
  { id: "kassawagen", label: "Kassawagen" },
  { id: "runner", label: "Runner" },
  { id: "ingang", label: "Ingang" },
];

export const festivalTaskOptions = staffTaskOptions.filter((task) =>
  festivalTaskIds.includes(task.id as FestivalTaskId),
);

export const buildTaskIds = ["opbouw", "afbouw"] as const;
export type BuildTaskId = (typeof buildTaskIds)[number];

export const halfDayIds = ["am", "pm"] as const;
export type HalfDayId = (typeof halfDayIds)[number];

export const halfDayOptions: { id: HalfDayId; label: string }[] = [
  { id: "am", label: "VM" },
  { id: "pm", label: "NM" },
];

export function isBuildTask(value: unknown): value is BuildTaskId {
  return buildTaskIds.includes(value as BuildTaskId);
}

export function isHalfDayId(value: unknown): value is HalfDayId {
  return halfDayIds.includes(value as HalfDayId);
}

export const staffDayIds = ["friday", "saturday", "both"] as const;

export type StaffDayId = (typeof staffDayIds)[number];

export const staffDayOptions: { id: StaffDayId; label: string }[] = [
  { id: "friday", label: "Vrijdag" },
  { id: "saturday", label: "Zaterdag" },
  { id: "both", label: "Beide dagen" },
];

export const opbouwDayIds = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
export type OpbouwDayId = (typeof opbouwDayIds)[number];

export const opbouwDayOptions: { id: OpbouwDayId; label: string }[] = [
  { id: "monday", label: "Maandag" },
  { id: "tuesday", label: "Dinsdag" },
  { id: "wednesday", label: "Woensdag" },
  { id: "thursday", label: "Donderdag" },
  { id: "friday", label: "Vrijdag" },
];

export const afbouwDayIds = ["sunday", "monday", "tuesday", "wednesday"] as const;
export type AfbouwDayId = (typeof afbouwDayIds)[number];

export const afbouwDayOptions: { id: AfbouwDayId; label: string }[] = [
  { id: "sunday", label: "Zondag" },
  { id: "monday", label: "Maandag" },
  { id: "tuesday", label: "Dinsdag" },
  { id: "wednesday", label: "Woensdag" },
];

export type PlanningDayId = "friday" | "saturday";

export const planningDayOptions: { id: PlanningDayId; label: string }[] = [
  { id: "friday", label: "Vrijdag" },
  { id: "saturday", label: "Zaterdag" },
];

export function isStaffTaskId(value: unknown): value is StaffTaskId {
  return staffTaskIds.includes(value as StaffTaskId);
}

export function isFestivalTask(taskId: StaffTaskId) {
  return festivalTaskIds.includes(taskId as FestivalTaskId);
}

export function isStaffDayId(value: unknown): value is StaffDayId {
  return staffDayIds.includes(value as StaffDayId);
}

export function isOpbouwDayId(value: unknown): value is OpbouwDayId {
  return opbouwDayIds.includes(value as OpbouwDayId);
}

export function isAfbouwDayId(value: unknown): value is AfbouwDayId {
  return afbouwDayIds.includes(value as AfbouwDayId);
}

export function sanitizeOpbouwDays(value: unknown): OpbouwDayId[] {
  const ids = Array.isArray(value) ? value : [];
  return ids.filter(isOpbouwDayId).filter((id, index, all) => all.indexOf(id) === index);
}

export function sanitizeAfbouwDays(value: unknown): AfbouwDayId[] {
  const ids = Array.isArray(value) ? value : [];
  return ids.filter(isAfbouwDayId).filter((id, index, all) => all.indexOf(id) === index);
}

export function formatStaffTasks(taskIds: StaffTaskId[]) {
  return taskIds
    .map((id) => staffTaskOptions.find((option) => option.id === id)?.label ?? id)
    .join(", ");
}

export function formatStaffTasksWithLead(taskIds: StaffTaskId[], leadIds: StaffTaskId[]) {
  return taskIds
    .map((id) => {
      const label = staffTaskOptions.find((option) => option.id === id)?.label ?? id;
      return leadIds.includes(id) ? `${label} *` : label;
    })
    .join(", ");
}

export function usersForTask<T extends { tasks: StaffTaskId[] }>(users: T[], taskId: StaffTaskId) {
  return users.filter((user) => user.tasks.includes(taskId));
}

export function usersForTasks<T extends { id: string; tasks: StaffTaskId[] }>(
  users: T[],
  taskIds: StaffTaskId[],
) {
  if (taskIds.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  return users.filter((user) => {
    if (!taskIds.some((taskId) => user.tasks.includes(taskId)) || seen.has(user.id)) {
      return false;
    }

    seen.add(user.id);
    return true;
  });
}

export function formatStaffDays(day: StaffDayId | null) {
  return staffDayOptions.find((option) => option.id === day)?.label ?? "Nog geen dag";
}

export function formatDayList<T extends string>(
  ids: T[],
  options: { id: T; label: string }[],
) {
  return ids
    .map((id) => options.find((option) => option.id === id)?.label ?? id)
    .join(", ");
}

export function formatUserSchedule(user: {
  days: StaffDayId | null;
  opbouwDays: OpbouwDayId[];
  afbouwDays: AfbouwDayId[];
}) {
  const parts: string[] = [];

  if (user.opbouwDays.length > 0) {
    parts.push(`Opbouw ${formatDayList(user.opbouwDays, opbouwDayOptions)}`);
  }

  if (user.afbouwDays.length > 0) {
    parts.push(`Afbouw ${formatDayList(user.afbouwDays, afbouwDayOptions)}`);
  }

  if (user.days) {
    parts.push(formatStaffDays(user.days));
  }

  return parts.join(" · ");
}

export function worksOnDay(days: StaffDayId | null, day: PlanningDayId) {
  return days === "both" || days === day;
}

export function toggleId<T extends string>(ids: T[], id: T) {
  return ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id];
}
