export function toISODate(d: Date): string {
  const p = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  if (!s || typeof s !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date();
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isWeekend(d: Date): boolean {
  const x = d.getDay();
  return x === 0 || x === 6;
}

export function fmtDE(d: Date): string {
  return d.toLocaleDateString("de-DE");
}

export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function workdaysBetweenInclusive(a: Date, b: Date): Date[] {
  const days: Date[] = [];
  let cur = new Date(a);
  cur.setHours(0, 0, 0, 0);

  const end = new Date(b);
  end.setHours(0, 0, 0, 0);

  while (cur <= end) {
    if (!isWeekend(cur)) days.push(new Date(cur));
    cur = addDays(cur, 1);
  }

  return days;
}
