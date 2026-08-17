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

export const staffTaskOptions: { id: StaffTaskId; label: string }[] = [
  { id: "opbouw", label: "Opbouw" },
  { id: "afbouw", label: "Afbouw" },
  { id: "toog-a", label: "Toog A" },
  { id: "toog-b", label: "Toog B" },
  { id: "kassawagen", label: "Kassawagen" },
  { id: "runner", label: "Runner" },
  { id: "ingang", label: "Ingang" },
];

export const staffDayIds = ["friday", "saturday", "both"] as const;

export type StaffDayId = (typeof staffDayIds)[number];

export const staffDayOptions: { id: StaffDayId; label: string }[] = [
  { id: "friday", label: "Vrijdag" },
  { id: "saturday", label: "Zaterdag" },
  { id: "both", label: "Beide dagen" },
];

export function isStaffTaskId(value: unknown): value is StaffTaskId {
  return staffTaskIds.includes(value as StaffTaskId);
}

export function isStaffDayId(value: unknown): value is StaffDayId {
  return staffDayIds.includes(value as StaffDayId);
}

export function formatStaffTasks(taskIds: StaffTaskId[]) {
  return taskIds
    .map((id) => staffTaskOptions.find((option) => option.id === id)?.label ?? id)
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
