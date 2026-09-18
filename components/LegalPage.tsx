import Link from "next/link";
import { legalOperator } from "@/lib/legal";

export function OperatorContact() {
  return (
    <address className="legal-address">
      <strong>{legalOperator.name}</strong>
      <br />
      {legalOperator.business}
      <br />
      {legalOperator.street}
      <br />
      {legalOperator.city}
      <br />
      Deutschland
      <p>
        Telefon:{" "}
        <a href={`tel:${legalOperator.phoneHref}`}>{legalOperator.phone}</a>
        <br />
        Telefax: {legalOperator.fax}
        <br />
        {legalOperator.email ? (
          <>
            E-Mail:{" "}
            <a href={`mailto:${legalOperator.email}`}>{legalOperator.email}</a>
          </>
        ) : (
          <>
            Elektronische Kontaktaufnahme:{" "}
            <Link href="/kontakt">Kontaktformular</Link>
          </>
        )}
      </p>
    </address>
  );
}

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="legal-page shell" id="rechtliches">
      <Link className="wordmark" href="/">
        LACACCINO
      </Link>
      <header className="legal-heading">
        <p className="eyebrow">LACACCINO / Rechtliches</p>
        <h1>{title}</h1>
        <p>{intro}</p>
        <p className="legal-date">Stand: 18. September 2026</p>
      </header>
      <div className="legal-content">{children}</div>
      <Link className="text-link" href="/">
        Zurück zur Markenwelt
      </Link>
    </main>
  );
}

export function LegalDraftNote() {
  if (legalOperator.email) return null;
  return (
    <aside className="legal-draft" aria-label="Hinweis zum Bearbeitungsstand">
      Vorschau: Die geschäftliche E-Mail-Adresse wird noch ergänzt. Die
      Anbieterangaben sind deshalb noch nicht vollständig.
    </aside>
  );
}
