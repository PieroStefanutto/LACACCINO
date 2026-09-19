import Link from "next/link";
import { signOut } from "@/app/community-actions";
import { staffSignOut } from "@/app/staff-actions";

export function PortalHeader({ admin = false, employee = false }: { admin?: boolean; employee?: boolean }) {
  return (
    <header className="portal-header shell">
      <Link className="wordmark" href="/">
        LACACCINO
      </Link>
      <div className="portal-header__links">
        <Link href={employee ? "/mitarbeiter" : admin ? "/konto" : "/kontakt"}>
          {employee ? "Mein Arbeitsbereich" : admin ? "Kundenansicht" : "Hilfe & Kontakt"}
        </Link>
        <form action={employee ? staffSignOut : signOut}>
          <button type="submit" className="portal-logout">
            Abmelden
          </button>
        </form>
      </div>
    </header>
  );
}
export function PortalNavigation({
  current = "uebersicht",
}: {
  current?: string;
}) {
  return (
    <nav className="portal-nav" aria-label="Kundenportal">
      <Link
        href="/konto"
        aria-current={current === "uebersicht" ? "page" : undefined}
      >
        Übersicht
      </Link>
      <Link
        href="/konto/bestellungen"
        aria-current={current === "bestellungen" ? "page" : undefined}
      >
        Bestellhistorie
      </Link>
      <Link
        href="/konto/lieblingsprodukte"
        aria-current={current === "lieblingsprodukte" ? "page" : undefined}
      >
        Meine Lieblingsprodukte
      </Link>
      <Link
        href="/konto/rabattcodes"
        aria-current={current === "rabattcodes" ? "page" : undefined}
      >
        Meine Rabattcodes
      </Link>
      <Link href="/konto#punkte">Mein Punktekonto</Link>
      <Link href="/konto#profil">Persönliche Angaben</Link>
      <Link href="/konto#nachrichten">Nachrichten & E-Mails</Link>
      <Link
        href="/konto#sicherheit"
        aria-current={current === "sicherheit" ? "page" : undefined}
      >
        Zugang & Sicherheit
      </Link>
    </nav>
  );
}
