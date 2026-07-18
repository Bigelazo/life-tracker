export function ownerEmail(): string | null {
  const raw = process.env.OWNER_EMAIL;
  if (!raw) return null;
  const trimmed = raw.trim();
  return trimmed === "" ? null : trimmed;
}

export function isOwnerEmail(candidate: string | null | undefined): boolean {
  if (!candidate) return false;
  const allowed = ownerEmail();
  if (!allowed) return false;
  return candidate.trim().toLowerCase() === allowed.toLowerCase();
}