"use server";

import { allowRequest } from "@/lib/community/rate-limit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupabaseAdmin,
  createSupabaseServer,
  isSupabaseConfigured,
  siteOrigin,
} from "@/lib/supabase/server";
import {
  field,
  validEmail,
  validPassword,
  validateContact,
  type FormState,
} from "@/lib/community/validation";

const unavailable: FormState = {
  ok: false,
  message:
    "Dieser Service ist momentan nicht verfügbar. Bitte versuche es später noch einmal.",
};

export async function sendContact(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  if (field(form, "website"))
    return { ok: true, message: "Vielen Dank für deine Nachricht." };
  const input = validateContact(form);
  if ("error" in input) return { ok: false, message: input.error! };
  try {
    if (!(await allowRequest("contact", 5)))
      return {
        ok: false,
        message: "Bitte warte etwas, bevor du eine weitere Anfrage sendest.",
      };
    const { error } = await createSupabaseAdmin()
      .from("contact_requests")
      .insert({
        name: input.name,
        email: input.email,
        message: input.message,
        consent_version: "contact-2026-09-17",
      });
    if (error) return unavailable;
    return {
      ok: true,
      message: "Vielen Dank. Deine Anfrage wurde gespeichert.",
    };
  } catch {
    return unavailable;
  }
}

export async function authenticate(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const mode = field(form, "mode");
  const email = field(form, "email").toLowerCase();
  const rawPassword = form.get("password");
  const password = typeof rawPassword === "string" ? rawPassword : "";
  if (!validEmail(email))
    return { ok: false, message: "Bitte gib eine gültige E-Mail-Adresse ein." };
  if (!["login", "signup", "reset"].includes(mode)) return unavailable;
  if (mode !== "login" && process.env.AUTH_EMAIL_ENABLED !== "true")
    return {
      ok: false,
      message:
        "Neue Registrierungen und Passwort-E-Mails sind noch nicht freigeschaltet.",
    };
  if (mode === "signup" && !validPassword(password))
    return {
      ok: false,
      message: "Dein Passwort muss 12 bis 128 Zeichen enthalten.",
    };
  if (mode === "login" && (!password || password.length > 128))
    return { ok: false, message: "Bitte gib dein Passwort ein." };
  if (mode === "signup" && field(form, "consent") !== "yes")
    return {
      ok: false,
      message: "Bitte bestätige die Speicherung deiner Kontodaten.",
    };
  try {
    if (!isSupabaseConfigured()) return unavailable;
    if (!(await allowRequest(`auth-${mode}`, mode === "login" ? 30 : 5)))
      return {
        ok: false,
        message: "Zu viele Versuche. Bitte probiere es später erneut.",
      };
    const supabase = await createSupabaseServer();
    if (mode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteOrigin()}/auth/callback?next=/konto/passwort`,
      });
      if (error) return unavailable;
      return {
        ok: true,
        message:
          "Falls ein Konto existiert, erhältst du eine E-Mail zum Zurücksetzen deines Passworts. Öffne sie in diesem Browser.",
      };
    }
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteOrigin()}/auth/callback`,
          data: { consent_version: "account-2026-09-17" },
        },
      });
      if (error)
        return {
          ok: false,
          message:
            "Die Registrierung konnte nicht abgeschlossen werden. Versuche es später oder nutze die Anmeldung, falls du bereits ein Konto hast.",
        };
      return {
        ok: true,
        message:
          "Prüfe dein E-Mail-Postfach und bestätige deine Adresse in diesem Browser. Falls du bereits ein Konto hast, melde dich an.",
      };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      return {
        ok: false,
        message:
          "Anmeldung fehlgeschlagen. Prüfe E-Mail, Passwort und die Bestätigung deiner E-Mail-Adresse.",
      };
  } catch {
    return unavailable;
  }
  redirect("/konto?welcome=1");
}

export async function saveProfile(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const displayName = field(form, "display_name");
  if (displayName.length > 100)
    return {
      ok: false,
      message: "Dein Name darf höchstens 100 Zeichen enthalten.",
    };
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user)
      return { ok: false, message: "Bitte melde dich erneut an." };
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: displayName });
    if (error) return unavailable;
    revalidatePath("/konto");
    return { ok: true, message: "Dein Profil wurde gespeichert." };
  } catch {
    return unavailable;
  }
}

export async function updateWaitlist(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const join = field(form, "intent") === "join";
  if (!join && field(form, "intent") !== "leave") return unavailable;
  if (join && field(form, "consent") !== "yes")
    return {
      ok: false,
      message:
        "Bitte bestätige, dass wir dich zum Markenstart per E-Mail informieren dürfen.",
    };
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user || !user.email_confirmed_at)
      return {
        ok: false,
        message: "Bitte bestätige deine E-Mail-Adresse und melde dich an.",
      };
    const result = join
      ? await supabase
          .from("waitlist_entries")
          .upsert(
            { user_id: user.id, consent_version: "launch-2026-09-17" },
            { onConflict: "user_id", ignoreDuplicates: true },
          )
      : await supabase.from("waitlist_entries").delete().eq("user_id", user.id);
    if (result.error) return unavailable;
    revalidatePath("/konto");
    return {
      ok: true,
      message: join
        ? "Du stehst auf der Warteliste für den geplanten Markenstart 2029."
        : "Du wurdest von der Warteliste entfernt.",
    };
  } catch {
    return unavailable;
  }
}

export async function changePassword(
  _previous: FormState,
  form: FormData,
): Promise<FormState> {
  const value = form.get("password");
  if (typeof value !== "string" || !validPassword(value))
    return {
      ok: false,
      message: "Dein neues Passwort muss 12 bis 128 Zeichen enthalten.",
    };
  if (value !== form.get("password_confirm"))
    return { ok: false, message: "Die Passwörter stimmen nicht überein." };
  try {
    const supabase = await createSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return {
        ok: false,
        message:
          "Bitte öffne den Link aus deiner E-Mail erneut oder melde dich an.",
      };
    const { error } = await supabase.auth.updateUser({ password: value });
    if (error)
      return {
        ok: false,
        message:
          "Das Passwort konnte nicht geändert werden. Verwende ein neues, starkes Passwort oder fordere einen neuen Link an.",
      };
    return { ok: true, message: "Dein Passwort wurde geändert." };
  } catch {
    return unavailable;
  }
}

export async function signOut() {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) redirect("/konto?error=logout");
  redirect("/konto");
}
