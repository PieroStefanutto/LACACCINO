import "server-only";
import { redirect } from "next/navigation";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabase/server";

export async function adminRole(userId: string) {
  const { data, error } = await createSupabaseAdmin()
    .from("portal_admins")
    .select("username,must_change_password")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Admin permissions unavailable");
  return data as { username: string; must_change_password: boolean } | null;
}

export async function requireAdmin(allowInitialPassword = false) {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/anmelden");
  const role = await adminRole(user.id);
  if (!role) redirect("/konto");
  if (role.must_change_password && !allowInitialPassword)
    redirect("/admin/passwort");
  return { user, role, supabase };
}

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
export const formatPoints = (value: number) =>
  new Intl.NumberFormat("de-DE").format(value);
