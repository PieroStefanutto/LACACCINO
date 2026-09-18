"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseAdmin,
  createSupabaseServer,
  siteOrigin,
} from "@/lib/supabase/server";
import { allowRequest } from "@/lib/community/rate-limit";
import {
  field,
  validEmail,
  validPassword,
  type FormState,
} from "@/lib/community/validation";
import { customerFields, pointsInput, isUuid } from "@/lib/portal/validation";
import { requireAdmin, adminRole } from "@/lib/portal/server";

const failed: FormState = {
  ok: false,
  message: "Das hat gerade nicht geklappt. Bitte versuche es erneut.",
};

export async function registerCustomer(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (process.env.AUTH_EMAIL_ENABLED !== "true")
    return {
      ok: false,
      message:
        "Neue Konten öffnen, sobald der E-Mail-Versand eingerichtet ist.",
    };
  const profile = customerFields(form);
  if ("error" in profile) return { ok: false, message: profile.error! };
  const email = field(form, "email").toLowerCase();
  if (!validEmail(email))
    return { ok: false, message: "Bitte prüfe deine E-Mail-Adresse." };
  if (field(form, "terms") !== "yes")
    return {
      ok: false,
      message: "Bitte bestätige die Hinweise zur Kontonutzung.",
    };
  try {
    if (!(await allowRequest("portal-register", 5)))
      return {
        ok: false,
        message: "Bitte warte etwas vor einem weiteren Versuch.",
      };
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${siteOrigin()}/auth/callback`,
        data: {
          ...profile,
          newsletter: field(form, "newsletter") === "yes",
          newsletter_version: "newsletter-2026-09-18",
          account_version: "account-2026-09-18",
        },
      },
    });
    if (error) return failed;
    return {
      ok: true,
      message:
        "Schau in dein Postfach. Mit deinem persönlichen Anmeldelink bestätigst du deine E-Mail-Adresse und öffnest dein Kundenportal.",
    };
  } catch {
    return failed;
  }
}

export async function requestLoginLink(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  if (process.env.AUTH_EMAIL_ENABLED !== "true")
    return {
      ok: false,
      message:
        "E-Mail-Links sind noch nicht freigeschaltet. Bestehende Konten können ihr Passwort verwenden.",
    };
  const email = field(form, "email").toLowerCase();
  if (!validEmail(email))
    return { ok: false, message: "Bitte prüfe deine E-Mail-Adresse." };
  try {
    if (!(await allowRequest("portal-link", 5)))
      return {
        ok: false,
        message: "Bitte warte etwas vor einem weiteren Versuch.",
      };
    const supabase = await createSupabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${siteOrigin()}/auth/callback`,
      },
    });
    if (error) return failed;
    return {
      ok: true,
      message:
        "Falls ein Konto zu dieser Adresse besteht, erhältst du deinen persönlichen Anmeldelink.",
    };
  } catch {
    return failed;
  }
}

export async function updateCustomerProfile(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const profile = customerFields(form);
  if ("error" in profile) return { ok: false, message: profile.error! };
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "Bitte melde dich erneut an." };
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...profile });
    if (error) return failed;
    revalidatePath("/konto");
    return {
      ok: true,
      message: "Deine persönlichen Angaben wurden gespeichert.",
    };
  } catch {
    return failed;
  }
}

export async function setNewsletter(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const intent = field(form, "intent");
  if (!["subscribe", "unsubscribe"].includes(intent)) return failed;
  try {
    const supabase = await createSupabaseServer();
    const { error } = await supabase.rpc("portal_set_newsletter", {
      wants_newsletter: intent === "subscribe",
    });
    if (error) return failed;
    revalidatePath("/konto");
    return {
      ok: true,
      message:
        intent === "subscribe"
          ? "Du hast den Newsletter abonniert. Deine Einwilligung ist gespeichert."
          : "Du bist vom Newsletter abgemeldet.",
    };
  } catch {
    return failed;
  }
}

export async function adminLogin(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const username = field(form, "username").toUpperCase();
  const password = form.get("password");
  let initial = false;
  if (
    username.length > 60 ||
    typeof password !== "string" ||
    !password ||
    password.length > 128
  )
    return failed;
  try {
    if (!(await allowRequest("admin-login", 10)))
      return {
        ok: false,
        message: "Zu viele Versuche. Bitte probiere es später erneut.",
      };
    const admin = createSupabaseAdmin();
    const { data: role } = await admin
      .from("portal_admins")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    if (!role)
      return {
        ok: false,
        message: "Anmeldung fehlgeschlagen. Bitte prüfe deine Zugangsdaten.",
      };
    const {
      data: { user: account },
    } = await admin.auth.admin.getUserById(role.user_id);
    if (!account?.email) return failed;
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password,
    });
    if (error || !data.user)
      return {
        ok: false,
        message: "Anmeldung fehlgeschlagen. Bitte prüfe deine Zugangsdaten.",
      };
    const verified = await adminRole(data.user.id);
    if (!verified) {
      await supabase.auth.signOut();
      return failed;
    }
    initial = verified.must_change_password;
  } catch {
    return failed;
  }
  redirect(initial ? "/admin/passwort" : "/admin");
}

export async function changeAdminPassword(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const { user, supabase } = await requireAdmin(true);
  const password = form.get("password");
  if (
    typeof password !== "string" ||
    !validPassword(password) ||
    password !== form.get("password_confirm")
  )
    return {
      ok: false,
      message:
        "Bitte zweimal dasselbe neue Passwort mit mindestens 12 Zeichen eingeben.",
    };
  try {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return failed;
    const { error: roleError } = await createSupabaseAdmin()
      .from("portal_admins")
      .update({ must_change_password: false })
      .eq("user_id", user.id);
    if (roleError) return failed;
  } catch {
    return failed;
  }
  redirect("/admin");
}

export async function bookPoints(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const input = pointsInput(form);
  if ("error" in input) return { ok: false, message: input.error! };
  const { error } = await supabase.rpc("portal_adjust_points", {
    target_user: input.userId,
    points_delta: input.amount,
    booking_reason: input.reason,
    request_key: input.requestKey,
  });
  if (error)
    return {
      ok: false,
      message: error.message.includes("Insufficient points")
        ? "Die Abbuchung übersteigt den Punktestand."
        : "Die Buchung wurde nicht ausgeführt. Bitte prüfe die Angaben und lade die Seite bei einer bereits verwendeten Buchung neu.",
    };
  revalidatePath("/konto");
  revalidatePath("/admin");
  revalidatePath(`/admin/kunden/${input.userId}`);
  return {
    ok: true,
    message:
      "Die Punktebuchung ist gespeichert. Eine erneute Übermittlung dieser Buchung erzeugt keine doppelten Punkte.",
  };
}

export async function updateContactStatus(
  _state: FormState,
  form: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = field(form, "id"),
    status = field(form, "status");
  if (!isUuid(id) || !["new", "in_progress", "closed"].includes(status))
    return failed;
  const { data, error } = await createSupabaseAdmin()
    .from("contact_requests")
    .update({ status })
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (error || !data) return failed;
  revalidatePath("/admin");
  return { ok: true, message: "Bearbeitungsstatus gespeichert." };
}
