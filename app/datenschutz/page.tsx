import Link from "next/link";
import {
  LegalDraftNote,
  LegalPage,
  OperatorContact,
} from "@/components/LegalPage";

export const metadata = {
  title: "Datenschutz | LACACCINO",
  description:
    "Informationen zur Verarbeitung personenbezogener Daten bei LACACCINO.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Datenschutz"
      intro="Informationen nach Art. 13 DSGVO zur Website, zu Kontaktanfragen, zum Konto und zur Warteliste."
    >
      <LegalDraftNote />
      <section>
        <h2>1. Verantwortlicher und Kontakt</h2>
        <OperatorContact />
        <p>
          Für Datenschutzanfragen, Auskunfts- oder Löschungswünsche kannst du
          die genannten Kontaktwege oder unser{" "}
          <Link href="/kontakt">Kontaktformular</Link> nutzen.
        </p>
      </section>
      <section>
        <h2>2. Aufruf der Website und Hosting</h2>
        <p>
          Beim Aufruf verarbeitet der Hostinganbieter Vercel technische
          Verbindungsdaten, insbesondere IP-Adresse, Zeitpunkt, aufgerufene
          Adresse, Browserinformationen und gegebenenfalls die zuvor besuchte
          Seite. Das ist erforderlich, um Inhalte auszuliefern, Fehler zu
          erkennen und Angriffe abzuwehren. Rechtsgrundlage ist Art. 6 Abs. 1
          Buchst. f DSGVO; unser berechtigtes Interesse ist ein sicherer und
          zuverlässiger Websitebetrieb.
        </p>
        <p>
          Vercel Inc. ist ein Anbieter mit Sitz in den USA und betreibt eine
          internationale Infrastruktur. Verbindungs- und Protokolldaten können
          daher auch außerhalb der EU bzw. des EWR verarbeitet werden.
          Protokolle werden im Rahmen der jeweiligen Hosting- und
          Sicherheitsfunktionen vorgehalten; maßgeblich sind deren konfigurierte
          Aufbewahrungsfristen sowie die Dauer, die für die Aufklärung eines
          konkreten Fehlers oder Sicherheitsvorfalls erforderlich ist.
        </p>
        <p>
          Informationen des Anbieters:{" "}
          <a href="https://vercel.com/legal/privacy-policy">
            Vercel Datenschutz
          </a>{" "}
          und{" "}
          <a href="https://vercel.com/legal/dpa">
            Vercel Datenverarbeitungsbedingungen
          </a>
          .
        </p>
      </section>
      <section>
        <h2>3. Kontaktanfragen</h2>
        <p>
          Bei einer Anfrage über das Formular verarbeiten wir deinen Namen,
          deine E-Mail-Adresse, den Nachrichtentext, den Eingangszeitpunkt, den
          Bearbeitungsstatus und die dokumentierte Bestätigung zur Verarbeitung.
          Die Angaben dienen der Bearbeitung und Beantwortung deiner Anfrage.
          Pflichtfelder sind erforderlich, damit du das Formular absenden
          kannst.
        </p>
        <p>
          Die im Formular erteilte Einwilligung ist Grundlage nach Art. 6 Abs. 1
          Buchst. a DSGVO. Soweit deine Anfrage auf einen Vertrag oder
          vorvertragliche Maßnahmen gerichtet ist, erfolgt die notwendige
          Verarbeitung nach Art. 6 Abs. 1 Buchst. b DSGVO. Deine Anfrage ist
          nicht öffentlich sichtbar und wird in unserer Supabase-Datenbank
          gespeichert.
        </p>
        <p>
          Die Speicherung richtet sich nach der Bearbeitung der Anfrage und
          einem gegebenenfalls anschließenden Vorgang. Nach Wegfall des Zwecks
          sind die Daten zu löschen, soweit keine gesetzlichen
          Aufbewahrungspflichten oder erforderlichen Nachweise entgegenstehen.
          Du kannst deine Einwilligung jederzeit über die genannten Kontaktwege
          widerrufen. Dies berührt die Rechtmäßigkeit der Verarbeitung vor dem
          Widerruf nicht.
        </p>
      </section>
      <section>
        <h2>4. Konto und Profil</h2>
        <p>
          Für die Anmeldung und Verwaltung eines Kontos verarbeitet Supabase
          deine E-Mail-Adresse, eine Nutzerkennung, Authentifizierungsdaten, den
          Bestätigungsstatus und technische Sitzungsdaten. Vorname, Nachname,
          die freiwillig angegebene Telefonnummer, der Anzeigename und der
          Zeitpunkt der Profilerstellung werden im Profil gespeichert. Neue
          Kunden erhalten nach Freischaltung des Mailversands einen persönlichen
          Anmeldelink. Passwörter bestehender Konten werden vom
          Authentifizierungsdienst geprüft; wir speichern sie nicht in der
          Profiltabelle.
        </p>
        <p>
          Rechtsgrundlage für die Bereitstellung und Verwaltung des von dir
          gewünschten Kontos ist Art. 6 Abs. 1 Buchst. b DSGVO. Die Angaben
          bleiben für die Dauer des Kontos erforderlich. Du kannst dein Konto
          unter <Link href="/konto/loeschen">Konto löschen</Link> selbst
          endgültig entfernen. Dabei werden der Authentifizierungszugang, das
          Profil, Wartelisten- und Newsletterdaten einschließlich
          Einwilligungsnachweisen, Punkte samt Buchungen und persönliche
          Rabattcodes aus dem aktuellen Kontosystem gelöscht. Du wirst
          abgemeldet. Administrationskonten sind von dieser
          Selbstbedienungsfunktion ausgenommen.
        </p>
        <p>
          Neue Registrierungen und Passwort-E-Mails sind derzeit deaktiviert.
          Ein späterer E-Mail-Versand wird erst nach Einrichtung des
          Versanddienstes freigeschaltet; diese Erklärung ist vorher
          entsprechend zu ergänzen.
        </p>
      </section>
      <section>
        <h2>5. Freiwillige Warteliste</h2>
        <p>
          Mit deiner gesonderten Einwilligung speichern wir die Zuordnung zu
          deinem bestätigten Konto, den Eintragszeitpunkt und die Version des
          Einwilligungstextes, um dich per E-Mail über Neuigkeiten zum geplanten
          Markenstart 2029 informieren zu können. Die E-Mail-Adresse wird aus
          deinem Konto verwendet. Rechtsgrundlage ist Art. 6 Abs. 1 Buchst. a
          DSGVO.
        </p>
        <p>
          Die Teilnahme ist freiwillig. Du kannst den Eintrag im Konto selbst
          entfernen oder deine Einwilligung über unsere Kontaktwege widerrufen.
          Die Abmeldung im Konto löscht den aktiven Wartelisteneintrag. Dein
          Konto bleibt davon unberührt. Ohne Widerruf ist die Speicherung an den
          Zweck der Information zum Markenstart gebunden; entfällt dieser Zweck,
          ist der Eintrag zu löschen.
        </p>
      </section>
      <section>
        <h2>Newsletter und Einwilligungsnachweis</h2>
        <p>
          Der Newsletter ist unabhängig von Konto und Warteliste freiwillig. Er
          umfasst Markenneuigkeiten und spätere Shop-Angebote per E-Mail. Die
          Checkbox bei der Registrierung ist nicht vorausgewählt. Ein neuer
          Eintrag wird erst nach Bestätigung der E-Mail-Adresse aktiviert.
          Bestehende Kunden können ihre Einstellung im geschützten Portal
          ändern. Der Versand startet erst nach Einrichtung des Maildienstes.
        </p>
        <p>
          Wir speichern deine Nutzerkennung, den aktuellen Anmeldestatus und zur
          Dokumentation Zeitpunkte, Quelle und Textversion der Einwilligung
          sowie spätere Abmeldungen. Rechtsgrundlage des Newsletters ist Art. 6
          Abs. 1 Buchst. a DSGVO. Du kannst ihn jederzeit im Portal oder durch
          eine Nachricht abbestellen. Danach wird die Adresse nicht mehr für
          diesen Newsletter verwendet.
        </p>
        <p>
          Der Nachweis einer erteilten oder widerrufenen Einwilligung wird nur
          so lange vorgehalten, wie er für gesetzliche Nachweispflichten bzw.
          die Abwehr von Rechtsansprüchen erforderlich ist (Art. 6 Abs. 1
          Buchst. c bzw. f DSGVO). Bei Löschung des Kontos werden die
          zugeordneten Newsletterdaten in diesem System mit gelöscht.
        </p>
      </section>
      <section>
        <h2>Punktekonto und Administration</h2>
        <p>
          Für dein Punktekonto speichern wir die Nutzerkennung, den aktuellen
          Punktestand und eine Buchungshistorie mit Punktzahl, Grund, Zeitpunkt
          und Kennung der ausführenden Administration. Kunden sehen nur ihre
          eigenen Daten. Berechtigte Administratoren können Kundenkonten und
          Kontaktanfragen einsehen und Punktebuchungen ausführen. Die
          Verarbeitung dient dem gewünschten Kundenportal nach Art. 6 Abs. 1
          Buchst. b DSGVO sowie dem Schutz vor fehlerhaften oder
          missbräuchlichen Buchungen nach Art. 6 Abs. 1 Buchst. f DSGVO.
        </p>
        <p>
          Punkte können derzeit nicht für Einkäufe eingelöst werden. Die
          Kontodaten und Buchungen werden für die Laufzeit des Kontos
          vorgehalten und bei seiner Löschung aus dem aktuellen System entfernt.
          Bei Einführung des Onlineshops sind die dann geltenden Zwecke und
          Aufbewahrungspflichten zusätzlich zu berücksichtigen.
        </p>
      </section>
      <section>
        <h2>Bestellhistorie, Lieblingsprodukte und Rabattcodes</h2>
        <p>
          Das Portal ist für den späteren Onlineshop vorbereitet. Sobald
          Bestellungen möglich sind, werden Bestellnummer, Zeitpunkt, Status,
          bestellte Artikel und Varianten, Mengen und Preise im Konto angezeigt.
          „Meine Lieblingsprodukte“ wird aus bezahlten, nicht stornierten oder
          vollständig erstatteten Bestellungen abgeleitet; es ist keine
          gesonderte Werbeprofilierung. Derzeit gibt es noch keinen aktiven
          Checkout.
        </p>
        <p>
          Für bestätigte Kundenkonten speichern wir fünf persönliche Gutscheine
          mit Code, Rabattstaffel, Mindestwarenwert und gegebenenfalls
          Aktivierungs- und Einlösungszeitpunkt. Dies dient der Bereitstellung
          deiner Kontovorteile und späteren Vertragsabwicklung nach Art. 6 Abs.
          1 Buchst. b DSGVO. Einlösungen dürfen nur durch den berechtigten
          Shopserver verarbeitet werden.
        </p>
        <p>
          Bei Kontolöschung endet der Portalzugriff; die Zuordnung vorhandener
          Bestellungen zum Authentifizierungskonto wird entfernt. Gesetzlich
          erforderliche Bestell- und Rechnungsbelege sind nach Art. 6 Abs. 1
          Buchst. c DSGVO getrennt für die jeweils einschlägige Pflicht
          aufzubewahren und anschließend zu löschen. Vor Shopstart werden der
          tatsächliche Zahlungs-/Versandprozess und die konkreten
          Aufbewahrungsfristen ergänzt. Kontolöschung storniert keine
          Bestellung.
        </p>
        <p>
          Frühere Kontaktanfragen, Hosting-/Sicherheitsprotokolle und
          gegebenenfalls Sicherungskopien werden durch die Kontolöschung nicht
          automatisch mit entfernt. Für sie gelten die jeweiligen Zwecke und
          Fristen aus dieser Erklärung. Weitergehende Löschungs- oder
          Auskunftsanfragen kannst du über unsere Kontaktwege stellen;
          notwendige Ausnahmen werden im konkreten Fall geprüft.
        </p>
      </section>
      <section>
        <h2>6. Supabase und Empfänger</h2>
        <p>
          Für Datenbank und Authentifizierung verwenden wir Supabase Pte. Ltd.,
          Singapur. Die Datenbank des eingesetzten Projekts liegt in der Region
          EU West (Irland). Dort werden Profile, Wartelisteneinträge,
          Kontaktanfragen und technische Daten zur Missbrauchsbegrenzung
          gespeichert. Die EU-Datenbankregion schließt Zugriffe oder weitere
          Verarbeitung außerhalb des EWR durch den Anbieter und seine
          Unterauftragnehmer nicht aus.
        </p>
        <p>
          Zugriff erhalten die zur Bearbeitung befugten Personen sowie die für
          Hosting und Datenbank eingesetzten Dienstleister im erforderlichen
          Umfang. Soweit rechtlich erforderlich, können Daten an zuständige
          Behörden oder zur Durchsetzung bzw. Abwehr von Rechtsansprüchen
          weitergegeben werden.
        </p>
        <p>
          Für Übermittlungen in Drittländer sehen die
          Datenverarbeitungsbedingungen der Anbieter insbesondere
          EU-Standardvertragsklauseln vor. Informationen zu diesen Garantien
          kannst du über unsere Kontaktwege anfordern. Anbieterinformationen:{" "}
          <a href="https://supabase.com/privacy">Supabase Datenschutz</a> und{" "}
          <a href="https://supabase.com/legal/dpa">
            Supabase Datenverarbeitungsbedingungen
          </a>
          .
        </p>
      </section>
      <section>
        <h2>7. Schutz vor Missbrauch</h2>
        <p>
          Bei Kontakt- und Anmeldeversuchen verwenden wir zur Begrenzung
          massenhafter Anfragen einen mit einem geheimen Schlüssel berechneten
          Hashwert der IP-Adresse, die Art der Anfrage, ein Stundenzeitfenster
          und einen Zähler. In dieser Begrenzungstabelle wird die IP-Adresse
          nicht im Klartext gespeichert. Die getrennte technische
          Protokollierung durch das Hosting bleibt hiervon unberührt.
        </p>
        <p>
          Einträge, deren Zeitfenster mehr als zwei Stunden zurückliegt, werden
          beim nächsten Aufruf der Begrenzungsfunktion entfernt. Rechtsgrundlage
          ist Art. 6 Abs. 1 Buchst. f DSGVO; berechtigtes Interesse ist der
          Schutz des Dienstes vor Missbrauch.
        </p>
      </section>
      <section>
        <h2>8. Cookies, Schriften und Medien</h2>
        <p>
          Wir setzen keine Analyse- oder Werbetracker ein. Die zur Anmeldung
          erforderlichen Cookies sind unter <Link href="/cookies">Cookies</Link>{" "}
          mit Zweck und Laufzeit beschrieben. Ihre Speicherung erfolgt für den
          ausdrücklich gewünschten Kontozugang nach § 25 Abs. 2 Nr. 2 TDDDG.
        </p>
        <p>
          Schriften, Bilder und Kartendaten sind lokal in die Website
          eingebunden und werden über das Hosting ausgeliefert. Dabei werden
          keine Schrift- oder Kartenanbieter vom Browser nachgeladen. Externe
          Links übertragen Daten an die jeweilige Zielwebsite erst, wenn du sie
          aufrufst.
        </p>
      </section>
      <section>
        <h2>9. Deine Rechte</h2>
        <p>
          Nach Maßgabe der gesetzlichen Voraussetzungen hast du das Recht auf
          Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und
          Datenübertragbarkeit (Art. 15 bis 20 DSGVO). Erteilte Einwilligungen
          kannst du jederzeit für die Zukunft widerrufen.
        </p>
        <p>
          <strong>Widerspruch:</strong> Soweit wir Daten auf Grundlage
          berechtigter Interessen verarbeiten, kannst du aus Gründen deiner
          besonderen Situation widersprechen (Art. 21 DSGVO). Einer Verarbeitung
          für Direktwerbung kannst du jederzeit widersprechen.
        </p>
        <p>
          Du kannst dich bei einer Datenschutzaufsichtsbehörde beschweren,
          insbesondere am Ort deines gewöhnlichen Aufenthalts, deines
          Arbeitsplatzes oder des vermuteten Verstoßes. Für den Sitz unseres
          Unternehmens ist der Landesbeauftragte für den Datenschutz und die
          Informationsfreiheit Baden-Württemberg zuständig. Die aktuellen
          Kontaktwege und das Beschwerdeformular findest du unter{" "}
          <a href="https://www.baden-wuerttemberg.datenschutz.de/beschwerde/">
            LfDI Baden-Württemberg – Beschwerde
          </a>
          .
        </p>
        <p>
          Es findet auf dieser Website keine automatisierte Entscheidung mit
          rechtlicher oder ähnlich erheblicher Wirkung und kein Werbeprofiling
          statt.
        </p>
      </section>
    </LegalPage>
  );
}
