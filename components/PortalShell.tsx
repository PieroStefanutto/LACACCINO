import Link from "next/link";
import { signOut } from "@/app/community-actions";

export function PortalHeader({ admin = false }: { admin?: boolean }) {
  return (
    <header className="portal-header shell">
      <Link className="wordmark" href="/">
        LACACCINO
      </Link>
      <div className="portal-header__links">
        <Link href={admin ? "/konto" : "/kontakt"}>
          {admin ? "Kundenansicht" : "Hilfe & Kontakt"}
        </Link>
        <form action={signOut}>
          <button type="submit" className="portal-logout">
            Abmelden
          </button>
        </form>
      </div>
    </header>
  );
}
export function PortalNavigation() {
  return (
    <nav className="portal-nav" aria-label="Kundenportal">
      <a href="#uebersicht">Übersicht</a>
      <a href="#punkte">Mein Punktekonto</a>
      <a href="#profil">Persönliche Angaben</a>
      <a href="#nachrichten">Nachrichten & E-Mails</a>
      <a href="#sicherheit">Zugang & Sicherheit</a>
    </nav>
  );
}
