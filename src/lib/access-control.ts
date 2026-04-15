const RESTRICTED_PREFIXES_FOR_GUEST = [
  "/archivo",
  "/eventos",
  "/cancionero",
  "/galeria",
  "/am-lagerfeuer",
] as const;

const GUEST_ALLOWED_EXACT = new Set(["/movimiento-scout"]);

export function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?")[0].split("#")[0];
  const trimmed = withoutQuery.replace(/\/+$/, "");
  return trimmed.length > 0 ? trimmed : "/";
}

export function isRestrictedForGuest(pathname: string): boolean {
  const normalized = normalizePathname(pathname);
  if (GUEST_ALLOWED_EXACT.has(normalized)) return false;

  return RESTRICTED_PREFIXES_FOR_GUEST.some(
    (prefix) =>
      normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}
