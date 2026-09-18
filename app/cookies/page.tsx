import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Cookies | LACACCINO",
  description:
    "Informationen über technisch notwendige Cookies und den Verzicht auf Werbetracking.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookies"
      intro="So wenig wie möglich. So viel wie für dein Konto nötig."
    >
      <section>
        <h2>Keine Werbung. Keine Besucheranalyse.</h2>
        <p>
          Diese Website bindet keine Analyse- oder Werbetracker ein. Schriften,
          Bilder und Kartendaten werden über unsere Website ausgeliefert. Es
          werden keine externen Videos oder Social-Media-Plugins geladen.
        </p>
        <p>
          Für diese Funktionen gibt es keine optionalen Cookies, die du annehmen
          oder ablehnen müsstest. Deshalb zeigen wir derzeit keinen
          Cookie-Einwilligungsdialog.
        </p>
      </section>
      <section>
        <h2>Notwendige Cookies für dein Konto</h2>
        <p>
          Wenn du dich anmeldest, speichern wir über Supabase Anmeldedaten als
          Cookies auf deinem Gerät. Sie ermöglichen die Zuordnung zu deinem
          Konto und die geschützte Nutzung von Profil und Warteliste.
        </p>
        <dl className="cookie-facts">
          <dt>Bezeichnung</dt>
          <dd>
            <code>sb-…-auth-token</code>; bei größeren Werten auf mehrere
            Cookies mit Endungen wie <code>.0</code> und <code>.1</code>{" "}
            verteilt.
          </dd>
          <dt>Zweck</dt>
          <dd>Authentifizierung, Erhalt und Erneuerung deiner Anmeldung.</dd>
          <dt>Anbieter</dt>
          <dd>LACACCINO; technische Umsetzung über Supabase.</dd>
          <dt>Speicherdauer</dt>
          <dd>
            Die eingesetzte Bibliothek setzt eine maximale Cookie-Laufzeit von
            400 Tagen. Bei einer Erneuerung der Anmeldung beginnt diese Laufzeit
            erneut. Die serverseitige Sitzung kann früher enden. Beim Abmelden
            werden die lokalen Anmeldecookies entfernt.
          </dd>
          <dt>Schutz</dt>
          <dd>
            In der veröffentlichten Website nur über HTTPS; für JavaScript nicht
            lesbar (HttpOnly), mit SameSite=Lax.
          </dd>
        </dl>
        <p>
          Bei einem E-Mail-Bestätigungs- oder Wiederherstellungsablauf kann
          zusätzlich ein Cookie mit der Endung{" "}
          <code>auth-token-code-verifier</code> den gestarteten Vorgang dem
          Browser zuordnen. Neue Registrierungen und Passwort-E-Mails sind
          derzeit deaktiviert.
        </p>
      </section>
      <section>
        <h2>Rechtsgrundlage und Kontrolle</h2>
        <p>
          Die Speicherung für die ausdrücklich gewünschte Anmeldung ist nach §
          25 Abs. 2 Nr. 2 TDDDG ohne Cookie-Einwilligung möglich. Die zugehörige
          Datenverarbeitung dient der Bereitstellung des Kontos nach Art. 6 Abs.
          1 Buchst. b DSGVO.
        </p>
        <p>
          Du kannst dich im Konto abmelden oder Cookies in deinem Browser
          löschen bzw. blockieren. Bei blockierten Anmeldecookies funktionieren
          der geschützte Kontobereich und die Warteliste möglicherweise nicht.
          Die öffentliche Markenwebsite bleibt erreichbar.
        </p>
        <p>
          Weitere Angaben zu Empfängern, Datenverarbeitung und deinen Rechten
          findest du in der{" "}
          <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>
      </section>
      <section>
        <h2>Animation ohne Browser-Speicher</h2>
        <p>
          Das dekorative Intro setzt keine Cookies und verwendet weder Local
          Storage noch Session Storage. Ob es bereits gezeigt wurde, merkt sich
          die laufende Seite nur im Arbeitsspeicher. Bei einem vollständigen
          Neuladen kann es erneut erscheinen. Du kannst es jederzeit
          überspringen; bei reduzierter Bewegung wird es nicht abgespielt.
        </p>
      </section>
      <section>
        <h2>Geschützte Vorschau</h2>
        <p>
          Wenn du diese Seite über eine zugangsgeschützte Vercel-Vorschau
          öffnest, kann Vercel zusätzliche Cookies für den Zugangsschutz setzen.
          Informationen zur dortigen Anmeldung findest du in{" "}
          <a href="https://vercel.com/legal/privacy-policy">
            Vercels Datenschutzhinweisen
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
