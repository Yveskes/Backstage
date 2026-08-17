import { createHmac, timingSafeEqual } from "crypto";

const LINK_TTL_SECONDS = 7 * 24 * 60 * 60;
const PURGE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type InviteKind = "staff" | "team";

export type InvitePayload = {
  email: string;
  firstName: string;
  lastName: string;
  kind: InviteKind;
  exp: number;
  nonce: string;
};

function getInviteSecret() {
  const secret =
    process.env.INVITE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.DATABASE_URL;

  if (!secret) {
    throw new Error("Missing INVITE_SECRET (or SUPABASE_SERVICE_ROLE_KEY / DATABASE_URL).");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getInviteSecret()).update(value).digest("base64url");
}

export function parseInviteKind(value: unknown): InviteKind {
  return value === "team" ? "team" : "staff";
}

export function createInviteToken(
  email: string,
  firstName: string,
  lastName: string,
  kind: InviteKind = "staff",
) {
  const payload: InvitePayload = {
    email: email.trim().toLowerCase(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    kind: parseInviteKind(kind),
    exp: Math.floor(Date.now() / 1000) + LINK_TTL_SECONDS,
    nonce: crypto.randomUUID(),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyInviteToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return { ok: false as const, reason: "invalid" as const };
  }

  const [body, signature] = parts;
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false as const, reason: "invalid" as const };
  }

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as InvitePayload & {
      name?: string;
    };
    const firstName = parsed.firstName || String(parsed.name ?? "").split(/\s+/)[0] || "";
    const lastName = parsed.lastName || String(parsed.name ?? "").split(/\s+/).slice(1).join(" ");
    const kind = parseInviteKind(parsed.kind);

    if (!parsed.email || !firstName || !parsed.exp) {
      return { ok: false as const, reason: "invalid" as const };
    }

    if (parsed.exp * 1000 < Date.now()) {
      return { ok: false as const, reason: "expired" as const };
    }

    return {
      ok: true as const,
      payload: {
        email: parsed.email,
        firstName,
        lastName,
        kind,
        exp: parsed.exp,
        nonce: parsed.nonce,
      },
    };
  } catch {
    return { ok: false as const, reason: "invalid" as const };
  }
}

export function inviteExpiryDates() {
  const now = Date.now();
  return {
    expiresAt: new Date(now + LINK_TTL_SECONDS * 1000).toISOString(),
    purgeAt: new Date(now + PURGE_TTL_MS).toISOString(),
  };
}

export function hashInviteToken(token: string) {
  return createHmac("sha256", getInviteSecret()).update(token).digest("hex");
}

export function isStrongPassword(password: string) {
  return (
    password.length >= 10 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}
