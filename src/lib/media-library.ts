import { FESTIVAL_YEARS, type FestivalYear } from "@/lib/festival-year";

export const libraryKinds = ["image", "video"] as const;
export type LibraryKind = (typeof libraryKinds)[number];

export type LibraryAsset = {
  id: string;
  kind: LibraryKind;
  name: string;
  mime: string;
  year: FestivalYear;
  createdAt: string;
  uploadedBy: string;
  bytes: number;
};

export const LIBRARY_KEY = "backstage.media.library";
export const LIBRARY_VIEW_KEY = "backstage.media.view";
export const MAX_LIBRARY_FILE_BYTES = 25 * 1024 * 1024;

export type LibraryView = "list" | "thumbs";

export function isLibraryView(value: unknown): value is LibraryView {
  return value === "list" || value === "thumbs";
}

function isLibraryKind(value: unknown): value is LibraryKind {
  return libraryKinds.includes(value as LibraryKind);
}

function isFestivalYear(value: unknown): value is FestivalYear {
  return FESTIVAL_YEARS.includes(value as FestivalYear);
}

export function libraryKindFromFile(file: File): LibraryKind | null {
  if (file.type.startsWith("image/")) {
    return "image";
  }

  if (file.type.startsWith("video/")) {
    return "video";
  }

  return null;
}

export function filterLibraryFiles(files: File[], kind: LibraryKind) {
  const accepted: File[] = [];
  let skippedKind = 0;
  let skippedSize = 0;

  for (const file of files) {
    if (libraryKindFromFile(file) !== kind) {
      skippedKind += 1;
      continue;
    }

    if (file.size > MAX_LIBRARY_FILE_BYTES) {
      skippedSize += 1;
      continue;
    }

    accepted.push(file);
  }

  return { accepted, skippedKind, skippedSize };
}

export function librarySkipMessage(kind: LibraryKind, skippedKind: number, skippedSize: number) {
  const parts: string[] = [];
  if (skippedKind > 0) {
    parts.push(
      skippedKind === 1
        ? `1 bestand was geen ${kind === "image" ? "foto" : "video"}`
        : `${skippedKind} bestanden waren geen ${kind === "image" ? "foto" : "video"}`,
    );
  }

  if (skippedSize > 0) {
    parts.push(`${skippedSize} groter dan 25 MB`);
  }

  if (parts.length === 0) {
    return null;
  }

  return `Overgeslagen: ${parts.join(", ")}.`;
}

export function formatFileBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAssetDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("nl-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function sanitizeLibraryAssets(raw: unknown): LibraryAsset[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const assets: LibraryAsset[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const data = entry as Partial<LibraryAsset>;
    if (!data.id || !data.name || !isLibraryKind(data.kind) || !isFestivalYear(data.year)) {
      continue;
    }

    const bytes = Number(data.bytes);
    assets.push({
      id: String(data.id),
      kind: data.kind,
      name: String(data.name),
      mime: String(data.mime ?? (data.kind === "video" ? "video/mp4" : "image/jpeg")),
      year: data.year,
      createdAt: String(data.createdAt ?? new Date().toISOString()),
      uploadedBy: String(data.uploadedBy ?? "Iemand"),
      bytes: Number.isFinite(bytes) && bytes > 0 ? Math.round(bytes) : 0,
    });
  }

  return assets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function downloadLibraryFile(asset: LibraryAsset, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = asset.name;
  link.click();
  URL.revokeObjectURL(url);
}
