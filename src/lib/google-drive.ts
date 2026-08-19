import { createSign } from "node:crypto";
import { FESTIVAL_YEARS, type FestivalYear } from "@/lib/festival-year";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const GOOGLE_APP_PREFIX = "application/vnd.google-apps.";

export type DriveItem = {
  id: string;
  name: string;
  mimeType: string;
  isFolder: boolean;
  modifiedAt: string;
  size: number | null;
};

export type DriveConfig = {
  email: string;
  privateKey: string;
  folderId: string;
};

type TokenCache = {
  token: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

function unwrapEnv(value: string) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

export function getDriveConfig(): DriveConfig | null {
  const email = unwrapEnv(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "");
  const privateKey = unwrapEnv(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "").replace(
    /\\n/g,
    "\n",
  );
  const folderId = unwrapEnv(process.env.GOOGLE_DRIVE_FOLDER_ID ?? "");

  if (!email || !privateKey.includes("BEGIN") || !folderId) {
    return null;
  }

  return { email, privateKey, folderId };
}

export function yearFolderEnv(year: FestivalYear) {
  return unwrapEnv(process.env[`GOOGLE_DRIVE_FOLDER_${year}`] ?? "");
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function getAccessToken(config: DriveConfig) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(
    JSON.stringify({
      iss: config.email,
      scope: DRIVE_SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const assertion = `${unsigned}.${signer.sign(config.privateKey).toString("base64url")}`;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = (await response.json()) as { access_token?: string; expires_in?: number; error?: string };
  if (!response.ok || !data.access_token) {
    throw new Error("Google Drive-aanmelding is mislukt. Controleer e-mail en private key.");
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, Number(data.expires_in ?? 3600) - 60) * 1000,
  };

  return data.access_token;
}

async function driveGet(config: DriveConfig, path: string) {
  const token = await getAccessToken(config);
  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? "Google Drive gaf een fout terug.");
  }

  return response;
}

type DriveFileRaw = {
  id?: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
};

function toItem(raw: DriveFileRaw): DriveItem | null {
  if (!raw.id || !raw.name || !raw.mimeType) {
    return null;
  }

  const size = raw.size ? Number(raw.size) : null;

  return {
    id: raw.id,
    name: raw.name,
    mimeType: raw.mimeType,
    isFolder: raw.mimeType === FOLDER_MIME,
    modifiedAt: raw.modifiedTime ?? "",
    size: Number.isFinite(size) ? size : null,
  };
}

export async function listDriveFolder(folderId: string): Promise<DriveItem[]> {
  const config = getDriveConfig();
  if (!config) {
    return [];
  }

  const items: DriveItem[] = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      q: `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
      orderBy: "folder, name",
      pageSize: "100",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await driveGet(config, `files?${params.toString()}`);
    const data = (await response.json()) as { files?: DriveFileRaw[]; nextPageToken?: string };
    for (const file of data.files ?? []) {
      const item = toItem(file);
      if (item) {
        items.push(item);
      }
    }
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);

  return items;
}

export async function getDriveFile(fileId: string): Promise<(DriveItem & { parents: string[] }) | null> {
  const config = getDriveConfig();
  if (!config) {
    return null;
  }

  const params = new URLSearchParams({
    fields: "id, name, mimeType, modifiedTime, size, parents",
    supportsAllDrives: "true",
  });
  const response = await driveGet(config, `files/${encodeURIComponent(fileId)}?${params.toString()}`);
  const raw = (await response.json()) as DriveFileRaw;
  const item = toItem(raw);
  if (!item) {
    return null;
  }

  return { ...item, parents: raw.parents ?? [] };
}

export async function isUnderFolder(fileId: string, rootId: string) {
  let current = fileId;
  for (let i = 0; i < 10; i += 1) {
    if (current === rootId) {
      return true;
    }

    const file = await getDriveFile(current);
    const parent = file?.parents[0];
    if (!parent) {
      return false;
    }

    current = parent;
  }

  return false;
}

export async function isAllowedDriveFile(fileId: string) {
  const config = getDriveConfig();
  if (!config) {
    return false;
  }

  const roots = [config.folderId, ...FESTIVAL_YEARS.map((year) => yearFolderEnv(year)).filter(Boolean)];
  for (const root of roots) {
    if (await isUnderFolder(fileId, root)) {
      return true;
    }
  }

  return false;
}

export async function folderIdForYear(year: FestivalYear) {
  const config = getDriveConfig();
  if (!config) {
    return null;
  }

  const override = yearFolderEnv(year);
  if (override) {
    return override;
  }

  const items = await listDriveFolder(config.folderId);
  const match = items.find(
    (item) => item.isFolder && (item.name === String(year) || item.name.startsWith(`${year} `)),
  );

  return match?.id ?? null;
}

export async function downloadDriveFile(fileId: string) {
  const config = getDriveConfig();
  if (!config) {
    throw new Error("Google Drive is nog niet ingesteld.");
  }

  const file = await getDriveFile(fileId);
  if (!file) {
    throw new Error("Bestand niet gevonden.");
  }

  const token = await getAccessToken(config);
  const isGoogleDoc = file.mimeType.startsWith(GOOGLE_APP_PREFIX) && !file.isFolder;
  const path = isGoogleDoc
    ? `files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent("application/pdf")}`
    : `files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`;

  const response = await fetch(`https://www.googleapis.com/drive/v3/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Downloaden uit Google Drive is mislukt.");
  }

  const filename = isGoogleDoc ? `${file.name}.pdf` : file.name;
  const mime = isGoogleDoc ? "application/pdf" : file.mimeType || "application/octet-stream";

  return { file: { ...file, name: filename, mimeType: mime }, body: response.body, mime };
}

export function driveFileKindLabel(mimeType: string) {
  if (mimeType === FOLDER_MIME) {
    return "Map";
  }

  if (mimeType === "application/pdf") {
    return "PDF";
  }

  if (mimeType.startsWith("image/")) {
    return "Afbeelding";
  }

  if (mimeType.startsWith("video/")) {
    return "Video";
  }

  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "Rekenblad";
  }

  if (mimeType.includes("document") || mimeType.includes("word")) {
    return "Document";
  }

  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) {
    return "Presentatie";
  }

  return "Bestand";
}

export function suggestedYearFolders() {
  return FESTIVAL_YEARS.map(String);
}
