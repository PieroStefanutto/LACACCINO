"use client";
import { useActionState, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  staffLogin,
  staffPassword,
  saveStaff,
  clockAction,
  manualTime,
  submitAbsence,
  reviewAbsence,
  cancelAbsence,
  voidTime,
  resetStaffPassword,
} from "@/app/staff-actions";
import {
  initialStaffState,
  euro,
  hours,
  totals,
  netSeconds,
  type StaffState,
  type Staff,
  type TimeEntry,
  type Absence,
} from "@/lib/staff/model";

type Action = (state: StaffState, form: FormData) => Promise<StaffState>;
function StaffForm({
  action,
  children,
  button,
  once = false,
}: {
  action: Action;
  children: ReactNode;
  button: string;
  once?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, initialStaffState);
  return (
    <form action={dispatch} className="community-form staff-form">
      <fieldset disabled={pending || (once && state.ok)}>
        {children}
        <button className="button" type="submit">
          {pending ? "Wird gespeichert …" : button}
        </button>
      </fieldset>
      {state.message && (
        <p
          className={`form-feedback${state.ok ? " form-feedback--success" : ""}`}
          role="status"
        >
          {state.message}
        </p>
      )}
      {state.credential && (
        <div className="staff-credential">
          <strong>Einmaliges Startpasswort</strong>
          <p>{state.credential.email}</p>
          <code>{state.credential.password}</code>
          <p>
            Jetzt kopieren und persönlich übergeben. Es wird nicht per E-Mail
            versendet.
          </p>
        </div>
      )}
      {once && state.ok && !state.credential && (
        <button
          type="button"
          className="text-link staff-refresh"
          onClick={() => window.location.reload()}
        >
          Weiteren Vorgang erfassen
        </button>
      )}
    </form>
  );
}
export function StaffLoginForm() {
  return (
    <StaffForm action={staffLogin} button="Im Mitarbeiterportal anmelden">
      <label>
        E-Mail-Adresse
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
        />
      </label>
      <label>
        Passwort
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
    </StaffForm>
  );
}
export function StaffPasswordForm() {
  return (
    <StaffForm action={staffPassword} button="Passwort speichern">
      <label>
        Neues Passwort
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      <label>
        Neues Passwort wiederholen
        <input
          name="password_confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
    </StaffForm>
  );
}
export function StaffSettingsForm({
  member,
  allowance,
  year,
}: {
  member?: Staff;
  allowance: number | null;
  year: number;
}) {
  return (
    <StaffForm
      action={saveStaff}
      button={member ? "Mitarbeiter speichern" : "Mitarbeiterzugang anlegen"}
      once={!member}
    >
      <input type="hidden" name="user_id" value={member?.user_id || ""} />
      <div className="portal-form-row">
        <label>
          Vorname
          <input
            name="first_name"
            defaultValue={member?.first_name}
            required
            maxLength={80}
          />
        </label>
        <label>
          Nachname
          <input
            name="last_name"
            defaultValue={member?.last_name}
            required
            maxLength={80}
          />
        </label>
      </div>
      <label>
        E-Mail-Adresse
        <input
          name="email"
          type="email"
          defaultValue={member?.email}
          readOnly={!!member}
          required
          maxLength={254}
        />
      </label>
      {!member && (
        <p className="form-note">
          Bestehende Konten erhalten die Mitarbeiterrolle. Für neue Konten wird
          ein einmaliges Startpasswort erzeugt. Bitte die Identität und
          E-Mail-Adresse vor der Einrichtung prüfen.
        </p>
      )}
      <div className="portal-form-row">
        <label>
          Stundenlohn brutto (€)
          <input
            name="rate"
            type="number"
            min="0"
            max="1000"
            step="0.01"
            defaultValue={member ? member.hourly_cents / 100 : ""}
            required
          />
        </label>
        <label>
          Urlaubsanspruch inkl. Übertrag (Tage)
          <input
            name="allowance"
            type="number"
            min="0"
            max="366"
            step="0.5"
            defaultValue={allowance ?? ""}
            required
          />
        </label>
      </div>
      <label>
        Urlaubsjahr
        <input
          name="year"
          type="number"
          min="2020"
          max="2099"
          defaultValue={year}
          required
        />
      </label>
      <p className="form-note">
        Anspruch für das ausgewählte Jahr eintragen. Lohnänderungen gelten für
        neue Zeitbuchungen; Feiertage und abweichende Dienstpläne werden bei der
        Urlaubsfreigabe berücksichtigt.
      </p>
      <div
        role="group"
        aria-label="Regelmäßige Arbeitstage"
        className="staff-weekdays"
      >
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day, i) => (
          <label key={day}>
            <input
              name="work_days"
              type="checkbox"
              value={i + 1}
              defaultChecked={(member?.work_days || [1, 2, 3, 4, 5]).includes(
                i + 1,
              )}
            />
            {day}
          </label>
        ))}
      </div>
      <label className="form-check">
        <input
          name="active"
          type="checkbox"
          value="yes"
          defaultChecked={member?.active ?? true}
        />
        Mitarbeiterzugang aktiv
      </label>
    </StaffForm>
  );
}

export function LiveWork({
  entries,
  open,
  serverNow,
  rate,
  currentMonth,
}: {
  entries: TimeEntry[];
  open: TimeEntry | null;
  serverNow: number;
  rate: number;
  currentMonth: boolean;
}) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      if (!document.hidden) setNow(serverNow + Date.now() - start);
    };
    const interval = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [serverNow]);
  const sum = totals(entries, now);
  return (
    <>
      <div className="staff-metrics">
        <div>
          <span>Geleistete Arbeitszeit</span>
          <strong>{hours(sum.seconds)}</strong>
          <small>Nach Abzug der Pausen</small>
        </div>
        <div>
          <span>Verdienst · Brutto-Schätzung</span>
          <strong>{euro(sum.cents)}</strong>
          <small>
            {currentMonth
              ? "Laufende Schicht wird mitgezählt"
              : "Gewählter Zeitraum"}
          </small>
        </div>
        <div>
          <span>Aktueller Stundenlohn</span>
          <strong>{euro(rate)}</strong>
          <small>Pro Arbeitsstunde · vom Admin festgelegt</small>
        </div>
      </div>
      {open && (
        <div className="staff-clock-status">
          <span
            className={`staff-dot${open.break_started_at ? " staff-dot--pause" : ""}`}
          />
          <div>
            <strong>
              {open.break_started_at
                ? "Du bist in Pause"
                : "Deine Arbeitszeit läuft"}
            </strong>
            <p>
              {hours(netSeconds(open, now))} ·{" "}
              {euro((netSeconds(open, now) / 3600) * open.hourly_cents)} bisher
              in dieser Schicht
            </p>
          </div>
        </div>
      )}
      <p className="form-note">
        Orientierung, keine Lohnabrechnung: ohne Steuern, Abgaben, Zuschläge und
        Vergütung für Urlaub oder Krankheit. Eine Schicht zählt zum Monat ihres
        Beginns (Europe/Berlin).
      </p>
    </>
  );
}
export function ClockForm({
  open,
  requestId,
}: {
  open: TimeEntry | null;
  requestId: string;
}) {
  return (
    <div className="staff-clock-actions">
      {(open
        ? [open.break_started_at ? "resume" : "pause", "stop"]
        : ["start"]
      ).map((operation) => (
        <StaffForm
          key={`${open?.id || requestId}-${operation}`}
          action={clockAction}
          button={
            {
              start: "Arbeit beginnen",
              pause: "Pause beginnen",
              resume: "Pause beenden",
              stop: "Arbeit beenden",
            }[operation]!
          }
        >
          <input type="hidden" name="operation" value={operation} />
          <input type="hidden" name="entry_id" value={open?.id || requestId} />
        </StaffForm>
      ))}
    </div>
  );
}
export function ManualTimeForm({
  id,
  memberId,
  admin = false,
}: {
  id: string;
  memberId: string;
  admin?: boolean;
}) {
  return (
    <StaffForm action={manualTime} button="Arbeitszeit nachtragen" once>
      <input name="entry_id" type="hidden" value={id} />
      <input name="user_id" type="hidden" value={memberId} />
      <input name="admin" type="hidden" value={admin ? "yes" : "no"} />
      <div className="portal-form-row">
        <label>
          Beginn · Europe/Berlin
          <input name="start" type="datetime-local" required />
        </label>
        <label>
          Ende · Europe/Berlin
          <input name="end" type="datetime-local" required />
        </label>
      </div>
      <label>
        Unbezahlte Pause (Minuten)
        <input
          name="pause"
          type="number"
          min="0"
          max="1440"
          step="1"
          defaultValue="0"
          required
        />
      </label>
      <label>
        Grund des Nachtrags
        <input
          name="note"
          required
          minLength={3}
          maxLength={300}
          placeholder="Zum Beispiel: Einstempeln vergessen"
        />
      </label>
      <p className="form-note">
        Nur vergangene Zeiten bis 24 Stunden pro Eintrag. Bereits belegte Zeiten
        können nicht doppelt gebucht werden. Es gilt der aktuell eingestellte
        Stundenlohn.
      </p>
    </StaffForm>
  );
}
export function AbsenceForm({
  kind,
  id,
}: {
  kind: "vacation" | "sick";
  id: string;
}) {
  return (
    <StaffForm
      action={submitAbsence}
      button={kind === "vacation" ? "Urlaub beantragen" : "Krankmeldung senden"}
      once
    >
      <input name="kind" type="hidden" value={kind} />
      <input name="request_id" type="hidden" value={id} />
      <div className="portal-form-row">
        <label>
          Von
          <input type="date" name="start" required />
        </label>
        <label>
          {kind === "sick" ? "Voraussichtlich bis" : "Bis einschließlich"}
          <input type="date" name="end" required />
        </label>
      </div>
      <p className="form-note">
        {kind === "sick"
          ? "Bitte keine Diagnose oder medizinischen Unterlagen angeben. Dies informiert die Administration; ein gegebenenfalls erforderlicher AU-Nachweis wird separat geklärt."
          : "Die Tage werden zunächst anhand deiner regelmäßigen Arbeitstage ermittelt. Feiertage oder halbe Tage berücksichtigt die Administration bei der Freigabe."}{" "}
        Jahresübergreifende Zeiträume bitte in zwei Meldungen aufteilen.
      </p>
    </StaffForm>
  );
}
export function AbsenceReviewForm({ request }: { request: Absence }) {
  return (
    <StaffForm action={reviewAbsence} button="Entscheidung speichern" once>
      <input type="hidden" name="request_id" value={request.id} />
      <input type="hidden" name="user_id" value={request.user_id} />
      <label>
        Entscheidung
        <select name="decision" required defaultValue="">
          <option value="" disabled>
            Bitte auswählen
          </option>
          <option value="approved">
            {request.kind === "sick" ? "Eingang bestätigen" : "Genehmigen"}
          </option>
          <option value="rejected">
            {request.kind === "sick" ? "Rückfrage stellen" : "Ablehnen"}
          </option>
        </select>
      </label>
      {request.kind === "vacation" && (
        <label>
          Anzurechnende Urlaubstage
          <input
            name="days"
            type="number"
            min="0"
            max={request.days}
            step="0.5"
            defaultValue={request.days}
            required
          />
          <small>
            Feiertage und abweichende Dienstpläne prüfen. Verringerungen bitte
            begründen.
          </small>
        </label>
      )}
      <label>
        Rückmeldung
        <input
          name="reply"
          maxLength={300}
          placeholder="Pflicht bei Ablehnung, Rückfrage oder Tageskorrektur"
        />
      </label>
      <p className="form-note">
        Die Rückmeldung ist für den Mitarbeiter sichtbar. Bitte keine
        medizinischen Angaben eintragen.
      </p>
    </StaffForm>
  );
}
export function CancelAbsenceForm({ id }: { id: string }) {
  return (
    <StaffForm action={cancelAbsence} button="Zurückziehen" once>
      <input type="hidden" name="request_id" value={id} />
    </StaffForm>
  );
}
export function VoidTimeForm({
  id,
  memberId,
}: {
  id: string;
  memberId: string;
}) {
  return (
    <StaffForm action={voidTime} button="Zeitbuchung stornieren" once>
      <input type="hidden" name="entry_id" value={id} />
      <input type="hidden" name="user_id" value={memberId} />
      <label>
        Korrekturgrund
        <input name="note" minLength={3} maxLength={300} required />
      </label>
    </StaffForm>
  );
}
export function StaffRefresh() {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) router.refresh();
    };
    const timer = setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);
  return (
    <button
      className="text-link staff-refresh"
      onClick={() => router.refresh()}
      type="button"
    >
      Übersicht aktualisieren
    </button>
  );
}
export function ResetStaffPasswordForm({ id }: { id: string }) {
  return (
    <StaffForm action={resetStaffPassword} button="Startpasswort erneuern" once>
      <input type="hidden" name="user_id" value={id} />
      <label className="form-check">
        <input type="checkbox" required />
        Zugangsanfrage geprüft und Identität bestätigt
      </label>
    </StaffForm>
  );
}
