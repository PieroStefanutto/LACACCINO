import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { berlinDay, type Staff, type TimeEntry, type Absence } from "./model";

export async function requireStaff(allowInitial = false) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/mitarbeiter/anmelden");
  const { data, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error("Mitarbeiterzugang konnte nicht geprüft werden.");
  if (!data?.active) redirect("/mitarbeiter/anmelden?access=missing");
  const staff = data as Staff;
  if (staff.must_change_password && !allowInitial)
    redirect("/mitarbeiter/passwort");
  return { user, staff, supabase };
}

export async function staffData(
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>,
  id: string,
  year: number,
) {
  // Entire selected year is loaded; a shift is assigned to its Berlin start date.
  const results = await Promise.all([
    allRows<TimeEntry>((offset) =>
      supabase
        .from("staff_time_entries")
        .select("*")
        .eq("user_id", id)
        .gte("started_at", `${year}-01-01T00:00:00+01:00`)
        .lt("started_at", `${year + 1}-01-01T00:00:00+01:00`)
        .order("started_at", { ascending: false })
        .order("id")
        .range(offset, offset + 499),
    ),
    supabase
      .from("staff_time_entries")
      .select("*")
      .eq("user_id", id)
      .is("ended_at", null)
      .eq("voided", false)
      .maybeSingle(),
    allRows<Absence>((offset) =>
      supabase
        .from("staff_requests")
        .select("*")
        .eq("user_id", id)
        .gte("starts_on", `${year}-01-01`)
        .lte("starts_on", `${year}-12-31`)
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + 499),
    ),
    supabase
      .from("staff_allowances")
      .select("days")
      .eq("user_id", id)
      .eq("year", year)
      .maybeSingle(),
  ]);
  if (results.some((r) => r.error))
    throw new Error(
      "Mitarbeiterdaten konnten nicht geladen werden. Bitte erneut versuchen.",
    );
  return {
    serverNow: Date.now(),
    entries: results[0].data as TimeEntry[],
    open: results[1].data as TimeEntry | null,
    requests: results[2].data as Absence[],
    allowance: results[3].data ? Number(results[3].data.days) : null,
  };
}
async function allRows<T>(
  page: (
    offset: number,
  ) => PromiseLike<{ data: unknown[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  for (let offset = 0; offset < 20000; offset += 500) {
    const result = await page(offset);
    if (result.error)
      throw new Error("Daten konnten nicht vollständig geladen werden.");
    rows.push(...((result.data || []) as T[]));
    if ((result.data?.length || 0) < 500) return { data: rows, error: null };
  }
  throw new Error(
    "Zu viele Jahresbuchungen. Bitte die Administration kontaktieren.",
  );
}
export function selectedYear(input?: string) {
  const current = Number(berlinDay(new Date()).slice(0, 4));
  return input && /^20\d{2}$/.test(input) ? Number(input) : current;
}
