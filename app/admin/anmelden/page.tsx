import Link from "next/link";
import { AdminLoginForm } from "@/components/PortalForms";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin-Anmeldung | LACACCINO",
  robots: { index: false, follow: false },
};
export default function AdminLoginPage() {
  return (
    <main className="account-page shell">
      <Link className="wordmark" href="/">
        LACACCINO
      </Link>
      <div className="account-heading">
        <p className="eyebrow">Administration</p>
        <h1>Alles im Blick.</h1>
        <p>
          Geschützter Zugang für die Verwaltung von Kunden, Punkten und
          Kontaktanfragen.
        </p>
      </div>
      <div className="community-card account-auth">
        <AdminLoginForm />
      </div>
      <Link className="text-link" href="/konto">
        Zum Kundenportal
      </Link>
    </main>
  );
}
