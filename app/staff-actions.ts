"use server";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createSupabaseAdmin,
  createSupabaseServer,
} from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/portal/server";
import { requireStaff } from "@/lib/staff/server";
import { field, validEmail, validPassword } from "@/lib/community/validation";
import { isUuid } from "@/lib/portal/validation";
import { allowRequest } from "@/lib/community/rate-limit";
import {
  berlinInstant,
  decimalInput,
  validDay,
  type StaffState,
} from "@/lib/staff/model";

function refresh(id?: string) {
  revalidatePath("/mitarbeiter");
  revalidatePath("/admin");
  revalidatePath("/admin/mitarbeiter");
  if (id) revalidatePath(`/admin/mitarbeiter/${id}`);
}
function result(
  error: { message: string } | null,
  message: string,
): StaffState {
  if (!error) return { ok: true, message };
  const messages: Record<string, string> = {
    "Time overlap":
      "Dieser Zeitraum überschneidet sich mit einer anderen Arbeitszeit.",
    "Absence overlap":
      "Für diesen Zeitraum liegt bereits eine entsprechende Meldung vor.",
    "Insufficient leave":
      "Das Urlaubskonto fehlt oder reicht für diese Freigabe nicht aus.",
    "Allowance below used days":
      "Der Anspruch darf bereits genehmigten Urlaub nicht unterschreiten.",
    "Open shift":
      "Bitte die laufende Arbeitszeit zuerst beenden oder stornieren.",
    "Request already reviewed":
      "Diese Meldung wurde bereits bearbeitet. Bitte die Seite aktualisieren.",
    "No work days":
      "Im gewählten Zeitraum liegen laut Wochenplan keine Arbeitstage.",
    "Reason required": "Bitte eine kurze Begründung angeben.",
    "Invalid days":
      "Bitte die anzurechnenden Urlaubstage prüfen (halbe Tage möglich).",
  };
  return {
    ok: false,
    message:
      messages[error.message] ||
      "Nicht gespeichert. Bitte Angaben prüfen und gegebenenfalls die Seite aktualisieren.",
  };
}

export async function staffLogin(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const email = field(form, "email").toLowerCase(),
    password = field(form, "password");
  const failed = {
    ok: false,
    message:
      "Anmeldung nicht möglich. Bitte Zugangsdaten und Freischaltung prüfen.",
  };
  if (!validEmail(email) || !password || password.length > 128) return failed;
  if (!(await allowRequest("staff-login", 10)))
    return {
      ok: false,
      message: "Zu viele Versuche. Bitte später erneut anmelden.",
    };
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return failed;
  const { data: member } = await supabase
    .from("staff_members")
    .select("active,must_change_password")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!member?.active) {
    await supabase.auth.signOut({ scope: "local" });
    return failed;
  }
  redirect(
    member.must_change_password ? "/mitarbeiter/passwort" : "/mitarbeiter",
  );
}
export async function staffPassword(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const { user, supabase } = await requireStaff(true);
  const password = field(form, "password");
  if (!validPassword(password) || password !== field(form, "password_confirm"))
    return {
      ok: false,
      message:
        "Bitte dasselbe neue Passwort zweimal eingeben (12 bis 128 Zeichen).",
    };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return result(error, "");
  const update = await createSupabaseAdmin()
    .from("staff_members")
    .update({ must_change_password: false })
    .eq("user_id", user.id);
  if (update.error) return result(update.error, "");
  redirect("/mitarbeiter");
}
export async function saveStaff(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const { supabase } = await requireAdmin();
  const first = field(form, "first_name"),
    last = field(form, "last_name"),
    email = field(form, "email").toLowerCase();
  const rate = decimalInput(field(form, "rate"), 1000),
    allowance = decimalInput(field(form, "allowance"), 366, true);
  const year = Number(field(form, "year"));
  const days = [...new Set(form.getAll("work_days").map(Number))];
  let id = field(form, "user_id");
  if (
    !first ||
    !last ||
    first.length > 80 ||
    last.length > 80 ||
    rate === null ||
    allowance === null ||
    !Number.isInteger(year) ||
    year < 2020 ||
    year > 2099 ||
    !days.length ||
    days.some((d) => !Number.isInteger(d) || d < 1 || d > 7) ||
    (id && !isUuid(id)) ||
    (!id && !validEmail(email))
  )
    return {
      ok: false,
      message:
        "Bitte Namen, E-Mail, Stundenlohn, Arbeitstage und Urlaubsanspruch prüfen.",
    };
  let credential: StaffState["credential"];
  let created = false;
  if (!id) {
    const existing = await supabase.rpc("staff_find_account", {
      account_email: email,
    });
    if (existing.error) return result(existing.error, "");
    id = existing.data || "";
    if (id) {
      const member = await supabase
        .from("staff_members")
        .select("user_id")
        .eq("user_id", id)
        .maybeSingle();
      if (member.error) return result(member.error, "");
      if (member.data)
        return {
          ok: false,
          message:
            "Dieser Mitarbeiter existiert bereits. Bitte den Eintrag öffnen.",
        };
    } else {
      const password = randomBytes(24).toString("base64url") + "!Aa1";
      const user = await createSupabaseAdmin().auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { first_name: first, last_name: last },
      });
      if (user.error || !user.data.user)
        return {
          ok: false,
          message:
            "Zugang konnte nicht angelegt werden. Bitte E-Mail-Adresse prüfen.",
        };
      id = user.data.user.id;
      created = true;
      credential = { email, password };
    }
  }
  const { error } = await supabase.rpc("staff_configure", {
    target_user: id,
    given_name: first,
    family_name: last,
    rate_cents: Math.round(rate * 100),
    weekdays: days,
    allowance_year: year,
    allowance_days: allowance,
    enabled: field(form, "active") === "yes",
  });
  if (error) {
    if (created) await createSupabaseAdmin().auth.admin.deleteUser(id);
    return result(error, "");
  }
  refresh(id);
  return {
    ok: true,
    message: credential
      ? "Mitarbeiter angelegt. Startpasswort jetzt sicher weitergeben; es wird nur hier angezeigt und muss beim ersten Login geändert werden."
      : "Gespeichert. Bestehende Arbeitszeiten behalten ihren erfassten Stundenlohn. Bestehende Konten verwenden ihr bisheriges Passwort.",
    credential,
  };
}
export async function resetStaffPassword(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const { user } = await requireAdmin();
  const id = field(form, "user_id");
  if (!isUuid(id)) return { ok: false, message: "Ungültiger Mitarbeiter." };
  const admin = createSupabaseAdmin();
  const { data: member, error } = await admin
    .from("staff_members")
    .select("email,active")
    .eq("user_id", id)
    .maybeSingle();
  if (error || !member?.active)
    return { ok: false, message: "Aktiver Mitarbeiterzugang erforderlich." };
  const flag = await admin
    .from("staff_members")
    .update({ must_change_password: true })
    .eq("user_id", id);
  if (flag.error) return result(flag.error, "");
  const password = randomBytes(24).toString("base64url") + "!Aa1";
  const update = await admin.auth.admin.updateUserById(id, { password });
  if (update.error) return result(update.error, "");
  await admin
    .from("staff_audit")
    .insert({ user_id: id, actor_id: user.id, event: "password_reset" });
  refresh(id);
  return {
    ok: true,
    message: "Neues Startpasswort erzeugt. Bitte jetzt sicher übergeben.",
    credential: { email: member.email, password },
  };
}
export async function staffSignOut() {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/mitarbeiter/anmelden");
}
export async function clockAction(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const { user, supabase } = await requireStaff();
  const operation = field(form, "operation"),
    id = field(form, "entry_id");
  if (!isUuid(id) || !["start", "pause", "resume", "stop"].includes(operation))
    return { ok: false, message: "Bitte Seite aktualisieren." };
  const { error } = await supabase.rpc("staff_clock", {
    operation,
    entry_id: id,
  });
  refresh(user.id);
  return result(
    error,
    {
      start: "Arbeitszeit läuft.",
      pause: "Pause gestartet.",
      resume: "Arbeitszeit läuft weiter.",
      stop: "Arbeitszeit gespeichert.",
    }[operation]!,
  );
}
export async function manualTime(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const admin = field(form, "admin") === "yes";
  const session = admin ? await requireAdmin() : await requireStaff();
  const target = admin ? field(form, "user_id") : session.user.id;
  const start = berlinInstant(field(form, "start")),
    end = berlinInstant(field(form, "end")),
    id = field(form, "entry_id"),
    pause = field(form, "pause"),
    note = field(form, "note");
  if (!start || !end)
    return {
      ok: false,
      message:
        "Bitte gültige Zeiten in Europe/Berlin wählen. Eine doppelte oder fehlende Stunde beim Zeitwechsel kann hier nicht gebucht werden.",
    };
  if (
    !isUuid(id) ||
    !isUuid(target) ||
    !/^\d{1,4}$/.test(pause) ||
    Number(pause) > 1440 ||
    note.length < 3 ||
    note.length > 300
  )
    return { ok: false, message: "Bitte Pause und kurze Begründung prüfen." };
  const { error } = await session.supabase.rpc("staff_manual_time", {
    entry_id: id,
    target_user: target,
    start_time: start,
    end_time: end,
    pause_minutes: Number(pause),
    explanation: note,
  });
  refresh(target);
  return result(
    error,
    "Arbeitszeit gespeichert. Für Korrekturen bitte die Administration kontaktieren.",
  );
}
export async function voidTime(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const { supabase } = await requireAdmin();
  const id = field(form, "entry_id");
  if (!isUuid(id)) return { ok: false, message: "Ungültiger Eintrag." };
  const { error } = await supabase.rpc("staff_void_time", {
    entry_id: id,
    explanation: field(form, "note"),
  });
  refresh(field(form, "user_id"));
  return result(
    error,
    "Zeit storniert. Der ursprüngliche Eintrag bleibt im Verlauf sichtbar.",
  );
}
export async function submitAbsence(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const { user, supabase } = await requireStaff();
  const id = field(form, "request_id"),
    kind = field(form, "kind"),
    start = field(form, "start"),
    end = field(form, "end");
  if (
    !isUuid(id) ||
    !["vacation", "sick"].includes(kind) ||
    !validDay(start) ||
    !validDay(end) ||
    end < start ||
    start.slice(0, 4) !== end.slice(0, 4)
  )
    return {
      ok: false,
      message:
        "Bitte einen gültigen Zeitraum innerhalb eines Kalenderjahres wählen. Jahresübergreifende Zeiträume bitte aufteilen.",
    };
  const { error } = await supabase.rpc("staff_request_absence", {
    request_id: id,
    absence_kind: kind,
    first_day: start,
    last_day: end,
  });
  refresh(user.id);
  return result(
    error,
    kind === "sick"
      ? "Krankmeldung ist eingegangen und in der Administration sichtbar."
      : "Urlaubsantrag eingereicht. Die Entscheidung erscheint hier im Verlauf.",
  );
}
export async function reviewAbsence(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const { supabase } = await requireAdmin();
  const id = field(form, "request_id"),
    decision = field(form, "decision"),
    days = decimalInput(field(form, "days") || "0", 366, true);
  if (
    !isUuid(id) ||
    !["approved", "rejected"].includes(decision) ||
    days === null
  )
    return { ok: false, message: "Bitte Entscheidung und Urlaubstage prüfen." };
  const { error } = await supabase.rpc("staff_review_absence", {
    request_id: id,
    decision,
    charged_days: days,
    reply: field(form, "reply"),
  });
  refresh(field(form, "user_id"));
  return result(
    error,
    "Entscheidung gespeichert und für den Mitarbeiter sichtbar.",
  );
}
export async function cancelAbsence(
  _: StaffState,
  form: FormData,
): Promise<StaffState> {
  const { user, supabase } = await requireStaff();
  const id = field(form, "request_id");
  if (!isUuid(id)) return { ok: false, message: "Ungültige Meldung." };
  const { error } = await supabase.rpc("staff_cancel_absence", {
    request_id: id,
  });
  refresh(user.id);
  return result(error, "Meldung zurückgezogen.");
}
