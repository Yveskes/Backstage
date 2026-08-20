import { briefingForTask } from "@/lib/task-briefings";

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

export function availableHalves(kind: BuildTaskId, day: string): HalfDayId[] {
  if (kind === "afbouw" && (day === "sunday" || day === "monday")) {
    return ["pm"];
  }

  return [...halfDayIds];
}

export function constrainHalves(kind: BuildTaskId, day: string, halves: HalfDayId[]): HalfDayId[] {
  const allowed = availableHalves(kind, day);
  return halves.filter((half) => allowed.includes(half));
}

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

export type FestivalByDay = Partial<Record<PlanningDayId, StaffTaskId>>;

export function isPlanningDayId(value: unknown): value is PlanningDayId {
  return value === "friday" || value === "saturday";
}

export function sanitizeFestivalByDay(
  raw: unknown,
  days: StaffDayId | null,
  tasks: StaffTaskId[],
): FestivalByDay {
  const festivalTasks = tasks.filter(isFestivalTask);
  const next: FestivalByDay = {};

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const data = raw as Record<string, unknown>;
    for (const day of planningDayOptions) {
      const postId = data[day.id];
      if (typeof postId === "string" && isFestivalTask(postId)) {
        next[day.id] = postId;
      }
    }
    if (Object.keys(next).length > 0) {
      return next;
    }
  }

  const first = festivalTasks[0];
  if (!first) {
    return {};
  }

  if (days === "both") {
    return { friday: first, saturday: first };
  }
  if (days === "friday") {
    return { friday: first };
  }
  if (days === "saturday") {
    return { saturday: first };
  }

  return {};
}

export function daysFromFestivalByDay(byDay: FestivalByDay): StaffDayId | null {
  const friday = Boolean(byDay.friday);
  const saturday = Boolean(byDay.saturday);
  if (friday && saturday) {
    return "both";
  }
  if (friday) {
    return "friday";
  }
  if (saturday) {
    return "saturday";
  }
  return null;
}

export function festivalPostIds(byDay: FestivalByDay): StaffTaskId[] {
  return [...new Set(Object.values(byDay).filter((id): id is StaffTaskId => Boolean(id)))];
}

export function daysForFestivalPost(byDay: FestivalByDay, postId: StaffTaskId): StaffDayId | null {
  const friday = byDay.friday === postId;
  const saturday = byDay.saturday === postId;
  if (friday && saturday) {
    return "both";
  }
  if (friday) {
    return "friday";
  }
  if (saturday) {
    return "saturday";
  }
  return null;
}

export function toggleFestivalPostDay(byDay: FestivalByDay, postId: StaffTaskId, day: PlanningDayId): FestivalByDay {
  const next = { ...byDay };
  if (next[day] === postId) {
    delete next[day];
    return next;
  }

  next[day] = postId;
  return next;
}

export function assignFestivalPostDay(byDay: FestivalByDay, postId: StaffTaskId, day: PlanningDayId): FestivalByDay {
  return { ...byDay, [day]: postId };
}

export function clearFestivalPostDay(byDay: FestivalByDay, day: PlanningDayId): FestivalByDay {
  const next = { ...byDay };
  delete next[day];
  return next;
}

export function clearFestivalPost(byDay: FestivalByDay, postId: StaffTaskId): FestivalByDay {
  const next = { ...byDay };
  for (const day of planningDayOptions) {
    if (next[day.id] === postId) {
      delete next[day.id];
    }
  }
  return next;
}

export function worksFestivalPostOnDay(byDay: FestivalByDay, postId: StaffTaskId, day: PlanningDayId) {
  return byDay[day] === postId;
}

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

export function festivalIncludesFriday(byDay: FestivalByDay) {
  return Boolean(byDay.friday);
}

export function withoutConflictingOpbouwFriday(opbouwDays: OpbouwDayId[], byDay: FestivalByDay): OpbouwDayId[] {
  if (!festivalIncludesFriday(byDay)) {
    return opbouwDays;
  }

  return opbouwDays.filter((day) => day !== "friday");
}

export function withoutFestivalFriday(byDay: FestivalByDay): FestivalByDay {
  return clearFestivalPostDay(byDay, "friday");
}

export function mergeFestivalTasks(tasks: StaffTaskId[], byDay: FestivalByDay): StaffTaskId[] {
  const other = tasks.filter((task) => !isFestivalTask(task));
  const festival = [...new Set([...tasks.filter(isFestivalTask), ...festivalPostIds(byDay)])];
  return [...other, ...festival];
}

export function festivalSchedulePatch(
  tasks: StaffTaskId[],
  byDay: FestivalByDay,
  opbouwDays: OpbouwDayId[],
) {
  return {
    festivalByDay: byDay,
    days: daysFromFestivalByDay(byDay),
    tasks: mergeFestivalTasks(tasks, byDay),
    opbouwDays: withoutConflictingOpbouwFriday(opbouwDays, byDay),
  };
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

export type AssignmentBlock = {
  id: StaffTaskId;
  title: string;
  days: string[];
  when: string;
  tasks: string;
};

export function assignmentBlocks(
  user: {
    tasks: StaffTaskId[];
    days: StaffDayId | null;
    festivalByDay?: FestivalByDay;
    opbouwDays: OpbouwDayId[];
    afbouwDays: AfbouwDayId[];
  },
  posts: FestivalPost[] = festivalPostCatalog,
): AssignmentBlock[] {
  const festivalByDay = user.festivalByDay ?? {};
  const festivalTasks = festivalPostIds(festivalByDay).map((id) => {
    const title = labelForTask(id, posts);
    const days = planningDayOptions.filter((day) => festivalByDay[day.id] === id).map((day) => day.label);
    const briefing = briefingForTask(id, title, daysForFestivalPost(festivalByDay, id));
    return {
      id,
      title,
      days,
      when: briefing.when,
      tasks: briefing.tasks,
    };
  });

  const blocks: AssignmentBlock[] = [...festivalTasks];

  if (user.opbouwDays.length > 0) {
    const days = opbouwDayOptions
      .filter((day) => user.opbouwDays.includes(day.id))
      .map((day) => day.label);
    const briefing = briefingForTask("opbouw", "Opbouw", null);
    blocks.push({
      id: "opbouw",
      title: "Opbouw",
      days,
      when: briefing.when,
      tasks: briefing.tasks,
    });
  }

  if (user.afbouwDays.length > 0) {
    const days = afbouwDayOptions
      .filter((day) => user.afbouwDays.includes(day.id))
      .map((day) => day.label);
    const briefing = briefingForTask("afbouw", "Afbouw", null);
    blocks.push({
      id: "afbouw",
      title: "Afbouw",
      days,
      when: briefing.when,
      tasks: briefing.tasks,
    });
  }

  return blocks;
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
