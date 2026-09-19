import Link from "next/link";

export function LegalFooter() {
  return (
    <div className="legal-footer shell">
      <nav aria-label="Rechtliche Informationen">
        <Link href="/impressum">Impressum</Link>
        <Link href="/datenschutz">Datenschutz</Link>
        <Link href="/agb">AGB & Nutzungshinweise</Link>
        <Link href="/cookies">Cookies</Link>
      </nav>
      <nav aria-label="Interne Zugänge">
        <Link href="/mitarbeiter">Mitarbeiterportal</Link>
        <Link href="/admin/anmelden" prefetch={false}>Adminzugang</Link>
      </nav>
      <p>Keine Analyse- oder Werbecookies.</p>
    </div>
  );
}
