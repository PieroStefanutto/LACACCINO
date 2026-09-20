import Link from "next/link";
import { clubMode, safeClubDestination } from "@/lib/club/config";
import { ClubForm } from "@/components/club/ClubForm";
import { ClubLogin } from "@/components/club/ClubLogin";
import { ClubMark } from "@/components/club/ClubShell";

export const dynamic = "force-dynamic";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeClubDestination((await searchParams).next);
  const mode = clubMode();
  return (
    <main className="club-login">
      <Link className="club-brand" href="/">
        <ClubMark />
        <span>
          LACACCINO<small>THE CLUB</small>
        </span>
      </Link>
      <div className="club-login-grid">
        <div>
          <p className="club-overline">Dein Kaffee. Dein Moment.</p>
          <h1>
            Ein guter Tag
            <br />
            beginnt <em>hier.</em>
          </h1>
          <p>
            Deine Karte, deine Lieblingsgetränke und kleine Gründe,
            wiederzukommen. Alles an einem Ort.
          </p>
          <div className="club-login-arch" aria-hidden="true">
            <ClubMark />
          </div>
          <p className="club-small">Geplanter Markenstart 2029</p>
        </div>
        <section className="club-panel">
          {mode === "supabase" && process.env.APP_ENV === "preview" && (
            <p className="club-notice">
              Club-Testumgebung mit separaten Testkonten. Dein Konto der
              öffentlichen Website gilt hier nicht. Keine echten Prämien oder
              Käufe.
            </p>
          )}
          <h2>
            {mode === "demo" ? "Den Club ausprobieren" : "Willkommen im Club"}
          </h2>
          {mode === "supabase" && process.env.APP_ENV === "production" && (
            <p className="club-small">
              Dein bestehendes LACACCINO-Konto gilt auch im Club. Für den Adminzugang mit Benutzername nutze die <Link href="/admin/anmelden">Admin-Anmeldung</Link>.
            </p>
          )}
          {mode === "demo" ? (
            <>
              <p className="club-notice">
                Lokale Demo mit fiktiven Testpersonen. Keine echte Anmeldung,
                keine E-Mails, keine echten Prämien. Änderungen bleiben in der
                lokalen Testdatenbank.
              </p>
              <ClubForm
                operation="demo-login"
                label="Demo öffnen"
                values={{ next }}
              >
                <label>
                  Testperson
                  <select name="persona">
                    <option value="mila">Mila · Kundin</option>
                    <option value="jonas">Jonas · zweites Kundenkonto</option>
                    <option value="team">Alex · Mitarbeiter</option>
                    <option value="leitung">Kim · Standortleitung</option>
                    <option value="admin">Robin · Administration</option>
                  </select>
                </label>
              </ClubForm>
              <p className="club-small">
                Die Testrollen simulieren eine bestätigte MFA-Sitzung. Sie
                prüfen keine echte Anmeldung.
              </p>
            </>
          ) : mode === "supabase" ? (
            <ClubLogin
              next={next}
              emailEnabled={process.env.AUTH_EMAIL_ENABLED === "true"}
            />
          ) : (
            <>
              <p>
                Der neue Club ist in dieser Umgebung noch nicht freigeschaltet.
                Dein bisheriges Kundenportal bleibt verfügbar.
              </p>
              <Link className="club-button" href="/konto">
                Zum bestehenden Kundenportal
              </Link>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
