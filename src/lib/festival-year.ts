export const FESTIVAL_YEARS = [2026, 2025, 2024] as const;
export const DEFAULT_FESTIVAL_YEAR = 2026;

export type FestivalYear = (typeof FESTIVAL_YEARS)[number];

export function parseFestivalYear(value: string | string[] | undefined): FestivalYear {
  const raw = Array.isArray(value) ? value[0] : value;
  const year = Number(raw);

  if (FESTIVAL_YEARS.includes(year as FestivalYear)) {
    return year as FestivalYear;
  }

  return DEFAULT_FESTIVAL_YEAR;
}
