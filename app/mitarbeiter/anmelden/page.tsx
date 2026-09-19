import Link from "next/link";
import { StaffLoginForm } from "@/components/StaffForms";
export const metadata = {
  title: "Mitarbeiter-Anmeldung | LACACCINO",
  robots: { index: false, follow: false },
};
export default function StaffLoginPage() {
  return (
    <main className="account-page shell portal-login">
      <Link className="wordmark" href="/">
        LACACCINO
      </Link>
      <div className="portal-login__grid">
        <div className="account-heading">
          <p className="eyebrow">Für unser Team</p>
          <h1>
            Dein Tag.
            <br />
            <em>Dein Überblick.</em>
          </h1>
          <p>
            Zeiten erfassen, deinen Verdienst im Blick behalten und
            Abwesenheiten einfach melden.
          </p>
          <p className="form-note">
            Deinen Zugang und ein Startpasswort erhältst du von der
            Administration. Bei einem bestehenden Konto verwendest du dein
            bisheriges Passwort.
          </p>
        </div>
        <div className="community-card">
          <h2>Mitarbeiter-Anmeldung</h2>
          <StaffLoginForm />
          <p className="form-note">
            Passwort vergessen oder Zugang nicht freigeschaltet? Bitte die
            Administration ansprechen. Es werden derzeit keine Anmelde-E-Mails
            versendet.
          </p>
        </div>
      </div>
      <Link className="text-link" href="/">
        Zur Homepage
      </Link>
    </main>
  );
}
