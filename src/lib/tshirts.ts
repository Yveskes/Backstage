export const tshirtSizes = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type TshirtSize = (typeof tshirtSizes)[number];

export function isTshirtSize(value: unknown): value is TshirtSize {
  return tshirtSizes.includes(value as TshirtSize);
}

export function sanitizeTshirtSize(value: unknown): TshirtSize | null {
  return isTshirtSize(value) ? value : null;
}

export function needsTshirt(kind: "admin" | "team" | "staff") {
  return kind === "staff" || kind === "team";
}

export function tshirtStatusLabel(confirmed: boolean, size: TshirtSize | null) {
  if (!confirmed) {
    return "Nog niet bevestigd";
  }

  return size ?? "—";
}

export function tshirtCsv(rows: Array<{
  fullName: string;
  email: string;
  tshirtSizeLastYear: TshirtSize | null;
  tshirtSize: TshirtSize | null;
  tshirtConfirmed: boolean;
}>) {
  const header = "Naam,E-mail,Maat vorig jaar,Maat dit jaar,Bevestigd";
  const lines = rows.map((row) =>
    [
      row.fullName,
      row.email,
      row.tshirtSizeLastYear ?? "",
      row.tshirtSize ?? "",
      row.tshirtConfirmed ? "ja" : "nee",
    ].join(","),
  );

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
