export const staffTaskIds = [
  "opbouw",
  "afbouw",
  "toog-a",
  "toog-b",
  "kassawagen",
  "runner",
  "ingang",
] as const;

export type BuiltinStaffTaskId = (typeof staffTaskIds)[number];
export type StaffTaskId = string;

export const festivalTaskIds = ["toog-a", "toog-b", "kassawagen", "runner", "ingang"] as const;
export type FestivalTaskId = string;

export type FestivalPost = {
  id: StaffTaskId;
  label: string;
  days: StaffDayId;
  order?: Partial<Record<"friday" | "saturday", number>>;
};

export const defaultFestivalPosts: FestivalPost[] = [
  { id: "toog-a", label: "Toog A", days: "both" },
  { id: "toog-b", label: "Toog B", days: "both" },
  { id: "kassawagen", label: "Kassawagen", days: "both" },
  { id: "runner", label: "Runner", days: "both" },
  { id: "ingang", label: "Ingang", days: "both" },
];

const builtinTaskLabels: Record<string, string> = {
  opbouw: "Opbouw",
  afbouw: "Afbouw",
};

export const staffTaskOptions: { id: StaffTaskId; label: string }[] = [
  { id: "opbouw", label: "Opbouw" },
  { id: "afbouw", label: "Afbouw" },
  ...defaultFestivalPosts.map((post) => ({ id: post.id, label: post.label })),
];

export const festivalTaskOptions = defaultFestivalPosts.map((post) => ({
  id: post.id,
  label: post.label,
}));

let festivalPostCatalog: FestivalPost[] = defaultFestivalPosts.map((post) => ({ ...post }));

export function setFestivalPostCatalog(posts: FestivalPost[]) {
  festivalPostCatalog = posts;
}

export function getFestivalPostCatalog() {
  return festivalPostCatalog;
}

export function staffTaskOptionsFor(posts: FestivalPost[]) {
  return [
    { id: "opbouw", label: "Opbouw" },
    { id: "afbouw", label: "Afbouw" },
    ...posts.map((post) => ({ id: post.id, label: post.label })),
  ];
}

export function postsForDay(posts: FestivalPost[], day: PlanningDayId) {
  const indexById = new Map(posts.map((post, index) => [post.id, index]));
  return posts
    .filter((post) => post.days === "both" || post.days === day)
    .sort((a, b) => {
      const aOrder = a.order?.[day];
      const bOrder = b.order?.[day];
      if (aOrder != null && bOrder != null && aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      if (aOrder != null && bOrder == null) {
        return -1;
      }
      if (aOrder == null && bOrder != null) {
        return 1;
      }
      return (indexById.get(a.id) ?? 0) - (indexById.get(b.id) ?? 0);
    });
}

function sanitizePostOrder(raw: unknown): FestivalPost["order"] {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const data = raw as Record<string, unknown>;
  const order: NonNullable<FestivalPost["order"]> = {};
  for (const day of ["friday", "saturday"] as const) {
    const value = Number(data[day]);
    if (Number.isFinite(value)) {
      order[day] = value;
    }
  }

  return Object.keys(order).length > 0 ? order : undefined;
}

export function moveFestivalPost(
  posts: FestivalPost[],
  postId: string,
  fromDay: PlanningDayId,
  toDay: PlanningDayId,
  beforeId: string | null,
): FestivalPost[] {
  if (fromDay !== toDay) {
    return posts;
  }

  const moving = posts.find((post) => post.id === postId);
  if (!moving) {
    return posts;
  }

  const visible = postsForDay(posts, toDay).filter((post) => post.id !== postId);
  const insertAt = beforeId ? visible.findIndex((post) => post.id === beforeId) : -1;
  const index = beforeId && insertAt >= 0 ? insertAt : visible.length;
  visible.splice(index, 0, moving);
  const orderOnDay = new Map(visible.map((post, order) => [post.id, order]));

  return posts.map((post) => {
    const order = orderOnDay.get(post.id);
    if (order == null) {
      return post;
    }

    return { ...post, order: { ...post.order, [toDay]: order } };
  });
}

export function slugifyPostLabel(label: string) {
  const slug = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "post";
}

export function uniquePostId(label: string, existing: FestivalPost[]) {
  const taken = new Set(["opbouw", "afbouw", ...existing.map((post) => post.id)]);
  const base = slugifyPostLabel(label);
  if (!taken.has(base)) {
    return base;
  }

  let index = 2;
  while (taken.has(`${base}-${index}`)) {
    index += 1;
  }

  return `${base}-${index}`;
}

export function sanitizeFestivalPosts(raw: unknown): FestivalPost[] {
  if (!Array.isArray(raw)) {
    return defaultFestivalPosts.map((post) => ({ ...post }));
  }

  return raw.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const data = entry as Partial<FestivalPost>;
    const id = String(data.id ?? "").trim();
    const label = String(data.label ?? "").trim();
    if (!id || !label || isBuildTask(id) || !isStaffTaskId(id)) {
      return [];
    }

    return [
      {
        id,
        label,
        days: isStaffDayId(data.days) ? data.days : "both",
        order: sanitizePostOrder(data.order),
      },
    ];
  });
}

export function labelForTask(taskId: StaffTaskId, posts: FestivalPost[] = festivalPostCatalog) {
  if (builtinTaskLabels[taskId]) {
    return builtinTaskLabels[taskId];
  }

  return posts.find((post) => post.id === taskId)?.label ?? staffTaskOptions.find((task) => task.id === taskId)?.label ?? taskId;
}

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
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  if ((staffTaskIds as readonly string[]).includes(value)) {
    return true;
  }

  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(value);
}

export function isFestivalTask(taskId: StaffTaskId) {
  return !isBuildTask(taskId) && isStaffTaskId(taskId);
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

export function formatStaffTasks(taskIds: StaffTaskId[], posts: FestivalPost[] = festivalPostCatalog) {
  return taskIds.map((id) => labelForTask(id, posts)).join(", ");
}

export function formatStaffTasksWithLead(
  taskIds: StaffTaskId[],
  leadIds: StaffTaskId[],
  posts: FestivalPost[] = festivalPostCatalog,
) {
  return taskIds
    .map((id) => {
      const label = labelForTask(id, posts);
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
