import Link from "next/link";
import { requireAdmin } from "@/lib/portal/server";
import { PortalHeader } from "@/components/PortalShell";
import { StaffSettingsForm, StaffRefresh } from "@/components/StaffForms";
import { AbsenceHistory } from "@/components/StaffPanels";
import { euro, berlinDay, type Staff, type Absence } from "@/lib/staff/model";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Teamverwaltung | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function StaffAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; inbox?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const page = Math.max(0, Math.min(2000, parseInt(query.page || "0") || 0)),
    inbox = Math.max(0, Math.min(2000, parseInt(query.inbox || "0") || 0));
  const [members, requests] = await Promise.all([
    supabase
      .from("staff_members")
      .select("*", { count: "exact" })
      .order("last_name")
      .order("user_id")
      .range(page * 50, page * 50 + 49),
    supabase
      .from("staff_requests")
      .select("*", { count: "exact" })
      .eq("status", "pending")
      .order("created_at")
      .range(inbox * 50, inbox * 50 + 49),
  ]);
  if (members.error || requests.error)
    throw new Error("Teamverwaltung konnte nicht geladen werden.");
  const rows = members.data as Staff[],
    absences = requests.data as Absence[];
  const ids = [...new Set(absences.map((r) => r.user_id))];
  const people = ids.length
    ? await supabase
        .from("staff_members")
        .select("user_id,first_name,last_name")
        .in("user_id", ids)
    : { data: [], error: null };
  if (people.error)
    throw new Error("Mitarbeiternamen konnten nicht geladen werden.");
  const names = Object.fromEntries(
    (people.data || []).map((p) => [
      p.user_id,
      `${p.first_name} ${p.last_name}`,
    ]),
  );
  return (
    <>
      <PortalHeader admin />
      <main className="portal shell staff-portal">
        <div className="portal-welcome">
          <div>
            <p className="eyebrow">LACACCINO / Administration</p>
            <h1>
              Dein Team.
              <br />
              <em>Alles im Blick.</em>
            </h1>
            <p>Arbeitszeiten, Urlaub und Krankmeldungen verwalten.</p>
          </div>
          <StaffRefresh />
        </div>
        <nav className="portal-nav" aria-label="Teamverwaltung">
          <Link href="/admin">Kunden & Kontakt</Link>
          <a href="#eingang">Neue Meldungen ({requests.count || 0})</a>
          <a href="#team">Mitarbeiter</a>
          <a href="#anlegen">Zugang anlegen</a>
        </nav>
        <section className="portal-panel" id="eingang">
          <div className="portal-section-heading">
            <h2>Neue Meldungen</h2>
            <span className="portal-badge">{requests.count || 0} offen</span>
          </div>
          <p className="form-note">
            Urlaubsanträge genehmigen oder ablehnen; Krankmeldungen bestätigen
            oder eine Rückfrage stellen. Die Übersicht aktualisiert sich jede
            Minute. Es werden keine E-Mails versendet.
          </p>
          <AbsenceHistory requests={absences} admin names={names} />
          <div className="portal-inline-links">
            {inbox > 0 && (
              <Link href={`?page=${page}&inbox=${inbox - 1}#eingang`}>
                Vorherige Meldungen
              </Link>
            )}
            {(requests.count || 0) > (inbox + 1) * 50 && (
              <Link href={`?page=${page}&inbox=${inbox + 1}#eingang`}>
                Weitere Meldungen
              </Link>
            )}
          </div>
        </section>
        <section className="portal-panel" id="team">
          <h2>Mitarbeiter ({members.count || 0})</h2>
          {rows.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Stundenlohn brutto</th>
                    <th>Zugang</th>
                    <th>Verwaltung</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((member) => (
                    <tr key={member.user_id}>
                      <td>
                        {member.first_name} {member.last_name}
                        <span>{member.email}</span>
                      </td>
                      <td>{euro(member.hourly_cents)}</td>
                      <td>
                        {!member.active
                          ? "Deaktiviert"
                          : member.must_change_password
                            ? "Erster Login ausstehend"
                            : "Aktiv"}
                      </td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/mitarbeiter/${member.user_id}`}
                        >
                          Stunden & Urlaub öffnen
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="portal-empty">
              Noch keine Mitarbeiter eingerichtet. Lege unten den ersten Zugang
              an.
            </p>
          )}
          <div className="portal-inline-links">
            {page > 0 && (
              <Link href={`?page=${page - 1}&inbox=${inbox}#team`}>
                Vorherige Mitarbeiter
              </Link>
            )}
            {(members.count || 0) > (page + 1) * 50 && (
              <Link href={`?page=${page + 1}&inbox=${inbox}#team`}>
                Weitere Mitarbeiter
              </Link>
            )}
          </div>
        </section>
        <section className="portal-panel staff-narrow" id="anlegen">
          <h2>Mitarbeiterzugang anlegen</h2>
          <StaffSettingsForm
            year={Number(berlinDay(new Date()).slice(0, 4))}
            allowance={null}
          />
        </section>
      </main>
    </>
  );
}
