export type Staff = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  hourly_cents: number;
  work_days: number[];
  active: boolean;
  must_change_password: boolean;
};
export type TimeEntry = {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  break_seconds: number;
  break_started_at: string | null;
  hourly_cents: number;
  source: string;
  voided: boolean;
  note: string;
};
export type Absence = {
  id: string;
  user_id: string;
  kind: "vacation" | "sick";
  starts_on: string;
  ends_on: string;
  days: number;
  status: string;
  response: string;
  created_at: string;
};
export type StaffState = {
  ok: boolean;
  message: string;
  credential?: { email: string; password: string };
};
export const initialStaffState: StaffState = { ok: false, message: "" };
export const euro = (cents: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
export const hours = (seconds: number) =>
  `${new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(seconds / 3600)} Std.`;
export const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
export const timeLabel = (iso: string) =>
  new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(new Date(iso));
export const berlinDay = (date: Date) =>
  new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
export function netSeconds(entry: TimeEntry, now: number) {
  if (entry.voided) return 0;
  const end = entry.ended_at ? Date.parse(entry.ended_at) : now;
  const ongoingPause = entry.break_started_at
    ? Math.max(0, (end - Date.parse(entry.break_started_at)) / 1000)
    : 0;
  return Math.max(
    0,
    (end - Date.parse(entry.started_at)) / 1000 -
      entry.break_seconds -
      ongoingPause,
  );
}
export function totals(entries: TimeEntry[], now: number) {
  return entries.reduce(
    (sum, entry) => {
      const seconds = netSeconds(entry, now);
      return {
        seconds: sum.seconds + seconds,
        cents: sum.cents + (seconds / 3600) * entry.hourly_cents,
      };
    },
    { seconds: 0, cents: 0 },
  );
}
export function leaveBalance(requests: Absence[], allowance: number) {
  const vacation = requests.filter((r) => r.kind === "vacation");
  const approved = vacation
    .filter((r) => r.status === "approved")
    .reduce((n, r) => n + Number(r.days), 0);
  const pending = vacation
    .filter((r) => r.status === "pending")
    .reduce((n, r) => n + Number(r.days), 0);
  return {
    approved,
    pending,
    remaining: allowance - approved,
    available: Math.max(0, allowance - approved - pending),
  };
}
export const statusLabel = (r: Absence) =>
  ({
    pending: r.kind === "sick" ? "Eingegangen" : "Offen",
    approved: r.kind === "sick" ? "Eingang bestätigt" : "Genehmigt",
    rejected: r.kind === "sick" ? "Rückfrage" : "Abgelehnt",
    cancelled: "Zurückgezogen",
  })[r.status] || r.status;
export function decimalInput(
  value: string,
  maximum: number,
  halfSteps = false,
): number | null {
  if (!/^\d{1,6}([.,]\d{1,2})?$/.test(value.trim())) return null;
  const number = Number(value.replace(",", "."));
  return number <= maximum && (!halfSteps || Number.isInteger(number * 2))
    ? number
    : null;
}
// Reject nonexistent/ambiguous clock-change times rather than silently moving a shift.
export function berlinInstant(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const guess = Date.parse(`${value}:00Z`);
  if (!Number.isFinite(guess)) return null;
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const matches = [1, 2]
    .map((offset) => new Date(guess - offset * 3600000))
    .filter((d) => formatter.format(d).replace(" ", "T") === value);
  return matches.length === 1 ? matches[0].toISOString() : null;
}
export function validDay(value: string) {
  return (
    /^20\d{2}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
