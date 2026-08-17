const extraFromEnv = (process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const ADMIN_EMAILS = Array.from(
  new Set(["yves@zeverrock.be", "yves.moreel@gmail.com", ...extraFromEnv]),
);

export function isAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
