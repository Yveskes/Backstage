import type { AppUser } from "@/lib/permissions";
import { halvesFor, type StaffPlanning } from "@/lib/staff-planning";
import { availableHalves, constrainHalves, type HalfDayId } from "@/lib/staff-tasks";

export const COMBI_DAYS = 5;
export const TOKENS_PER_HALF = 3;

export type BuildReward = {
  userId: string;
  fullName: string;
  email: string;
  halfDays: number;
  days: number;
  tokens: number;
  combiTicket: boolean;
};

export function rewardFromHalves(entries: HalfDayId[][]) {
  const halfDays = entries.reduce((sum, halves) => sum + halves.length, 0);
  const days = entries.filter((halves) => halves.length === 2).length;

  return {
    halfDays,
    days,
    tokens: halfDays * TOKENS_PER_HALF,
    combiTicket: days >= COMBI_DAYS,
  };
}

export function rewardForUser(planning: StaffPlanning, user: AppUser): BuildReward {
  const entries: HalfDayId[][] = [];

  for (const day of user.opbouwDays) {
    const marked = constrainHalves("opbouw", day, halvesFor(planning, "opbouw", day, user.id));
    entries.push(marked.length > 0 ? marked : availableHalves("opbouw", day));
  }

  for (const day of user.afbouwDays) {
    const marked = constrainHalves("afbouw", day, halvesFor(planning, "afbouw", day, user.id));
    entries.push(marked.length > 0 ? marked : availableHalves("afbouw", day));
  }

  const counts = rewardFromHalves(entries);
  return {
    userId: user.id,
    fullName: user.fullName || user.email,
    email: user.email,
    ...counts,
  };
}

export function rewardsForUsers(users: AppUser[], planning: StaffPlanning): BuildReward[] {
  return users
    .filter(
      (user) =>
        user.tasks.includes("opbouw") ||
        user.tasks.includes("afbouw") ||
        user.opbouwDays.length > 0 ||
        user.afbouwDays.length > 0,
    )
    .map((user) => rewardForUser(planning, user))
    .sort((a, b) => {
      if (a.combiTicket !== b.combiTicket) {
        return a.combiTicket ? -1 : 1;
      }

      if (b.tokens !== a.tokens) {
        return b.tokens - a.tokens;
      }

      return a.fullName.localeCompare(b.fullName, "nl");
    });
}

export function buildRewardsCsv(rows: BuildReward[]) {
  const header = "Naam,E-mail,Halve dagen,Volledige dagen,Drankjetons,Combiticket";
  const lines = rows.map((row) =>
    [row.fullName, row.email, row.halfDays, row.days, row.tokens, row.combiTicket ? "ja" : "nee"].join(","),
  );

  return `${header}\n${lines.join("\n")}\n`;
}

export function downloadBuildRewardsCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `opbouw-afbouw-vergoedingen-${new Date().getFullYear()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
