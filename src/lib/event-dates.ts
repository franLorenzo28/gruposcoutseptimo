const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Calendar dates are local dates, not UTC instants. Keep multi-day events until their last day.
export function eventDateRange(value: string): { start: Date; end: Date } | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})(?:T.*)?$/.exec(value.trim());
  const named = /^(\d{1,2}(?:(?:\s*,\s*|\s+y\s+|\s+al\s+|\s*-\s*)\d{1,2})*)\s+de\s+([a-z]+),?\s+(\d{4})$/i.exec(value.trim());
  if (!iso && !named) return null;
  const year = Number(iso?.[1] ?? named?.[3]);
  const month = iso ? Number(iso[2]) - 1 : months.indexOf(named![2]!.toLowerCase());
  const days = iso ? [Number(iso[3])] : named![1]!.match(/\d+/g)!.map(Number);
  if (month < 0 || month > 11 || days.some(day => day < 1 || day > new Date(year, month + 1, 0).getDate())) return null;
  return { start: new Date(year, month, Math.min(...days)), end: new Date(year, month, Math.max(...days), 23, 59, 59, 999) };
}

export function isCurrentOrUpcomingEvent(value: string, now = new Date()): boolean {
  const range = eventDateRange(value);
  return range !== null && range.end >= now;
}

export function formatEventDate(value: string): string {
  const range = eventDateRange(value);
  if (!range) return value || "Fecha por confirmar";
  const { start, end } = range;
  if (start.getDate() !== end.getDate()) return `${start.getDate()}–${end.getDate()} de ${months[start.getMonth()]} de ${start.getFullYear()}`;
  return start.toLocaleDateString("es-UY", { day: "numeric", month: "long", year: "numeric" });
}
