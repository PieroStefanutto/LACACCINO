import Link from "next/link";
import { randomUUID } from "node:crypto";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/portal/server";
import { selectedYear, staffData } from "@/lib/staff/server";
import { isUuid } from "@/lib/portal/validation";
import { leaveBalance, type Staff } from "@/lib/staff/model";
import { PortalHeader } from "@/components/PortalShell";
import {
  LiveWork,
  ManualTimeForm,
  StaffSettingsForm,
  StaffRefresh,
  ResetStaffPasswordForm,
} from "@/components/StaffForms";
import { TimeHistory, AbsenceHistory } from "@/components/StaffPanels";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Mitarbeiterverwaltung | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function MemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const year = selectedYear((await searchParams).year);
  const { data: member, error } = await supabase
    .from("staff_members")
    .select("*")
    .eq("user_id", id)
    .maybeSingle();
  if (error) throw new Error("Mitarbeiter konnte nicht geladen werden.");
  if (!member) notFound();
  const staff = member as Staff;
  const data = await staffData(supabase, id, year);
  const balance = leaveBalance(data.requests, data.allowance ?? 0);
  const audit = await supabase
    .from("staff_audit")
    .select("event,created_at,details")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(30);
  if (audit.error)
    throw new Error("Änderungsverlauf konnte nicht geladen werden.");
  return (
    <>
      <PortalHeader admin />
      <main className="portal shell staff-portal">
        <Link className="text-link" href="/admin/mitarbeiter">
          ← Zur Teamübersicht
        </Link>
        <div className="portal-welcome">
          <div>
            <p className="eyebrow">Mitarbeiterverwaltung</p>
            <h1>
              {staff.first_name} <em>{staff.last_name}</em>
            </h1>
            <p>{staff.email}</p>
          </div>
          <StaffRefresh />
        </div>
        <nav className="portal-nav" aria-label="Mitarbeiterverwaltung">
          <a href="#zeiten">Arbeitszeiten</a>
          <a href="#abwesenheiten">Urlaub & Krankmeldungen</a>
          <a href="#einstellungen">Lohn & Urlaubskonto</a>
        </nav>
        <form className="staff-period" method="get">
          <label>
            Jahr
            <input
              type="number"
              name="year"
              min="2020"
              max="2099"
              defaultValue={year}
            />
          </label>
          <button className="button">Jahr anzeigen</button>
        </form>
        <section className="portal-panel" id="zeiten">
          <h2>Arbeitszeiten · {year}</h2>
          <LiveWork
            entries={data.entries}
            open={data.open}
            serverNow={data.serverNow}
            rate={staff.hourly_cents}
            currentMonth={false}
          />
          <TimeHistory entries={data.entries} admin />
          <details className="staff-details">
            <summary>Zeit nachtragen / korrigierten Eintrag erfassen</summary>
            <ManualTimeForm id={randomUUID()} memberId={id} admin />
          </details>
        </section>
        <section className="portal-panel" id="abwesenheiten">
          <h2>Urlaub & Krankmeldungen · {year}</h2>
          <div className="staff-metrics">
            <div>
              <span>Anspruch inkl. Übertrag</span>
              <strong>{data.allowance ?? "–"} Tage</strong>
            </div>
            <div>
              <span>Genehmigt</span>
              <strong>{balance.approved} Tage</strong>
            </div>
            <div>
              <span>Verbleibend</span>
              <strong>
                {data.allowance === null ? "–" : balance.remaining} Tage
              </strong>
            </div>
          </div>
          <AbsenceHistory requests={data.requests} admin />
        </section>
        <section className="portal-panel staff-narrow" id="einstellungen">
          <h2>Lohn, Urlaub & Zugang</h2>
          <StaffSettingsForm
            key={year}
            member={staff}
            year={year}
            allowance={data.allowance}
          />
          <details className="staff-details">
            <summary>Neues Startpasswort erzeugen</summary>
            <p className="form-note">
              Nur für eine bestätigte Zugangsanfrage. Der Mitarbeiter muss
              anschließend ein neues eigenes Passwort festlegen.
            </p>
            <ResetStaffPasswordForm id={id} />
          </details>
        </section>
        <section className="portal-panel">
          <h2>Änderungsverlauf</h2>
          <p className="form-note">
            Letzte 30 Vorgänge. Zeitstornierungen und Entscheidungen bleiben
            nachvollziehbar.
          </p>
          <ul className="staff-audit">
            {(audit.data || []).map((item, i) => (
              <li key={i}>
                <time>
                  {new Date(item.created_at).toLocaleString("de-DE", {
                    timeZone: "Europe/Berlin",
                  })}
                </time>
                <span>
                  {(
                    {
                      settings: "Stammdaten / Urlaubskonto gespeichert",
                      manual_time: "Arbeitszeit nachgetragen",
                      void_time: "Zeitbuchung storniert",
                      clock_start: "Arbeit begonnen",
                      clock_pause: "Pause begonnen",
                      clock_resume: "Pause beendet",
                      clock_stop: "Arbeit beendet",
                      absence_submitted: "Meldung eingereicht",
                      absence_approved: "Meldung bestätigt / genehmigt",
                      absence_rejected: "Meldung beantwortet / abgelehnt",
                      absence_cancelled: "Meldung zurückgezogen",
                      password_reset: "Startpasswort erneuert",
                    } as Record<string, string>
                  )[item.event] || item.event}
                  {item.details?.reason && ` · ${item.details.reason}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
