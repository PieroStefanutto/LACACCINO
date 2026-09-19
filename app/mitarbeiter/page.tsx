import Link from "next/link";
import { randomUUID } from "node:crypto";
import { requireStaff, staffData, selectedYear } from "@/lib/staff/server";
import { berlinDay, leaveBalance } from "@/lib/staff/model";
import { PortalHeader } from "@/components/PortalShell";
import {
  LiveWork,
  ClockForm,
  ManualTimeForm,
  AbsenceForm,
  StaffRefresh,
} from "@/components/StaffForms";
import { TimeHistory, AbsenceHistory } from "@/components/StaffPanels";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Mitarbeiterportal | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function EmployeePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { staff, supabase } = await requireStaff();
  const query = await searchParams;
  const today = berlinDay(new Date());
  const year = selectedYear(query.year);
  const month =
    query.month === "all"
      ? "all"
      : /^(0[1-9]|1[0-2])$/.test(query.month || "")
        ? query.month!
        : today.slice(5, 7);
  const data = await staffData(supabase, staff.user_id, year);
  const monthly =
    month === "all"
      ? data.entries
      : data.entries.filter((e) =>
          berlinDay(new Date(e.started_at)).startsWith(`${year}-${month}`),
        );
  const balance = leaveBalance(data.requests, data.allowance ?? 0);
  return (
    <>
      <PortalHeader employee />
      <main className="portal shell staff-portal">
        <div className="portal-welcome">
          <div>
            <p className="eyebrow">LACACCINO / Mitarbeiterportal</p>
            <h1>
              Hallo, {staff.first_name}.<br />
              <em>Dein Arbeitstag im Blick.</em>
            </h1>
            <p>Arbeitszeit, Verdienst und Abwesenheiten an einem Ort.</p>
          </div>
          <StaffRefresh />
        </div>
        <nav className="portal-nav" aria-label="Mitarbeiterportal">
          <a href="#arbeitszeit">Arbeitszeit & Verdienst</a>
          <a href="#stunden">Stundenübersicht</a>
          <a href="#urlaub">Urlaub</a>
          <a href="#krankmeldung">Krankmeldung</a>
          <a href="#meldungen">Meine Meldungen</a>
          <Link href="/mitarbeiter/passwort">Passwort ändern</Link>
        </nav>
        <section className="portal-panel" id="arbeitszeit">
          <div className="portal-section-heading">
            <div>
              <p className="eyebrow">Deine Zeiterfassung</p>
              <h2>Arbeitszeit & Verdienst</h2>
            </div>
          </div>
          <form className="staff-period" method="get">
            <label>
              Monat
              <select name="month" defaultValue={month}>
                <option value="all">Gesamtes Jahr</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={String(i + 1).padStart(2, "0")}>
                    {new Intl.DateTimeFormat("de-DE", { month: "long" }).format(
                      new Date(2029, i, 1),
                    )}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Jahr
              <input
                name="year"
                type="number"
                min="2020"
                max="2099"
                defaultValue={year}
              />
            </label>
            <button className="button">Zeitraum anzeigen</button>
          </form>
          <LiveWork
            entries={monthly}
            open={data.open}
            serverNow={data.serverNow}
            rate={staff.hourly_cents}
            currentMonth={`${year}-${month}` === today.slice(0, 7)}
          />
          <ClockForm open={data.open} requestId={randomUUID()} />
          <details className="staff-details">
            <summary>Arbeitszeit nachtragen</summary>
            <ManualTimeForm id={randomUUID()} memberId={staff.user_id} />
          </details>
        </section>
        <section className="portal-panel" id="stunden">
          <h2>Deine Stundenübersicht</h2>
          <p className="form-note">
            {month === "all" ? year : `${month}/${year}`} · Für Korrekturen
            bitte die Administration kontaktieren. Stornierte Einträge zählen
            nicht zum Verdienst.
          </p>
          <TimeHistory entries={monthly} />
        </section>
        <div className="staff-two-column">
          <section className="portal-panel" id="urlaub">
            <p className="eyebrow">Dein Urlaubskonto {year}</p>
            <h2>Zeit für dich.</h2>
            {data.allowance === null ? (
              <p className="form-feedback">
                Für {year} ist noch kein Anspruch hinterlegt. Bitte die
                Administration kontaktieren.
              </p>
            ) : (
              <>
                <div className="staff-leave-total">
                  <strong>{balance.remaining}</strong>
                  <span>Tage verbleibend</span>
                </div>
                <dl className="staff-balances">
                  <div>
                    <dt>Anspruch inkl. Übertrag</dt>
                    <dd>{data.allowance} Tage</dd>
                  </div>
                  <div>
                    <dt>Genehmigt (genommen & geplant)</dt>
                    <dd>{balance.approved} Tage</dd>
                  </div>
                  <div>
                    <dt>Offen beantragt</dt>
                    <dd>{balance.pending} Tage</dd>
                  </div>
                  <div>
                    <dt>Nach offenen Anträgen verfügbar</dt>
                    <dd>{balance.available} Tage</dd>
                  </div>
                </dl>
              </>
            )}
            <AbsenceForm kind="vacation" id={randomUUID()} />
          </section>
          <section className="portal-panel" id="krankmeldung">
            <p className="eyebrow">Einfach Bescheid geben</p>
            <h2>Krankmelden.</h2>
            <p className="form-note">
              Melde hier Beginn und voraussichtliches Ende. Die Administration
              sieht deine Meldung im geschützten Bereich.
            </p>
            <AbsenceForm kind="sick" id={randomUUID()} />
          </section>
        </div>
        <section className="portal-panel" id="meldungen">
          <h2>Meine Meldungen · {year}</h2>
          <p className="form-note">
            Entscheidungen werden bei geöffneter Seite regelmäßig aktualisiert.
            Offene Meldungen kannst du zurückziehen.
          </p>
          <AbsenceHistory requests={data.requests} />
        </section>
        <p className="form-note">
          <Link href="/datenschutz#mitarbeiter">
            Datenschutz im Mitarbeiterportal
          </Link>
        </p>
      </main>
    </>
  );
}
