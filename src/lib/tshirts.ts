import type { StaffDayId } from "@/lib/staff-tasks";

export const tshirtSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type TshirtSize = (typeof tshirtSizes)[number];

export type TshirtPerson = {
  kind: "admin" | "team" | "staff";
  days: StaffDayId | null;
  tshirtSizeLastYear: TshirtSize | null;
  tshirtSize: TshirtSize | null;
  tshirtSizeSaturday: TshirtSize | null;
  tshirtConfirmed: boolean;
};

export function isTshirtSize(value: unknown): value is TshirtSize {
  return tshirtSizes.includes(value as TshirtSize);
}

export function sanitizeTshirtSize(value: unknown): TshirtSize | null {
  return isTshirtSize(value) ? value : null;
}

export function needsTshirt(kind: "admin" | "team" | "staff") {
  return kind === "staff" || kind === "team";
}

export function getsTshirtPerFestivalDay(days: StaffDayId | null) {
  return days === "both";
}

export function hasConfirmedTshirt(person: Pick<TshirtPerson, "days" | "tshirtSize" | "tshirtSizeSaturday" | "tshirtConfirmed">) {
  if (!person.tshirtConfirmed || !person.tshirtSize) {
    return false;
  }

  if (getsTshirtPerFestivalDay(person.days)) {
    return Boolean(person.tshirtSizeSaturday);
  }

  return true;
}

export function orderedTshirtSizes(person: Pick<TshirtPerson, "days" | "tshirtSize" | "tshirtSizeSaturday" | "tshirtConfirmed">): TshirtSize[] {
  if (!hasConfirmedTshirt(person) || !person.tshirtSize) {
    return [];
  }

  if (getsTshirtPerFestivalDay(person.days) && person.tshirtSizeSaturday) {
    return [person.tshirtSize, person.tshirtSizeSaturday];
  }

  return [person.tshirtSize];
}

export function formatTshirtSizes(person: Pick<TshirtPerson, "days" | "tshirtSize" | "tshirtSizeSaturday">) {
  if (getsTshirtPerFestivalDay(person.days)) {
    const friday = person.tshirtSize ?? "—";
    const saturday = person.tshirtSizeSaturday ?? "—";
    if (person.tshirtSize && person.tshirtSizeSaturday && person.tshirtSize === person.tshirtSizeSaturday) {
      return `2× ${person.tshirtSize}`;
    }

    return `Vr ${friday} · Za ${saturday}`;
  }

  return person.tshirtSize ?? "—";
}

export function tshirtStatusLabel(confirmed: boolean, size: TshirtSize | null) {
  if (!confirmed) {
    return "Nog niet bevestigd";
  }

  return size ?? "—";
}

export function tshirtCsv(
  rows: Array<{
    fullName: string;
    email: string;
    days: StaffDayId | null;
    tshirtSizeLastYear: TshirtSize | null;
    tshirtSize: TshirtSize | null;
    tshirtSizeSaturday: TshirtSize | null;
    tshirtConfirmed: boolean;
  }>,
) {
  const header = "Naam,E-mail,Festivaldagen,Maat vorig jaar,Maat vrijdag,Maat zaterdag,Aantal,Bevestigd";
  const lines = rows.map((row) => {
    const twoDays = getsTshirtPerFestivalDay(row.days);
    const confirmed = hasConfirmedTshirt(row);
    return [
      row.fullName,
      row.email,
      twoDays ? "vrijdag en zaterdag" : row.days === "saturday" ? "zaterdag" : row.days === "friday" ? "vrijdag" : "",
      row.tshirtSizeLastYear ?? "",
      row.tshirtSize ?? "",
      twoDays ? (row.tshirtSizeSaturday ?? "") : "",
      twoDays ? "2" : "1",
      confirmed ? "ja" : "nee",
    ].join(",");
  });

  return `${header}\n${lines.join("\n")}\n`;
}

export function downloadTshirtCsv(csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `tshirts-zeverrock-${new Date().getFullYear()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
