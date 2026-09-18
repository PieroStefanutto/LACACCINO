import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "AGB & Nutzungshinweise | LACACCINO",
  description:
    "Hinweise zur kostenlosen Website, zum Konto und zur freiwilligen Warteliste.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="AGB & Nutzungshinweise"
      intro="Der aktuelle Auftritt stellt die Marke vor und bietet einen kostenlosen Kontobereich mit Warteliste."
    >
      <section>
        <h2>1. Anbieter und Angebot</h2>
        <p>
          Anbieter ist Piero Stefanutto, Dächle – das schwäbische Wirtshaus,
          Hintere Straße 2, 74348 Lauffen/ Neckar. Die vollständigen verfügbaren
          Kontaktdaten stehen im <Link href="/impressum">Impressum</Link>.
        </p>
        <p>
          Diese Hinweise beschreiben die derzeitige Nutzung der Website. Es gibt
          aktuell keinen Onlineshop, keine kostenpflichtigen Abonnements und
          keine Bestellmöglichkeit. Daher werden hier keine Verkaufs-AGB,
          Lieferbedingungen oder Widerrufsbelehrungen für Warenkäufe vereinbart.
        </p>
      </section>
      <section>
        <h2>2. Designstudien und Marktstart</h2>
        <p>
          Der Marktstart ist für 2029 geplant. Produktbilder, Raumdarstellungen
          und Ortsideen zeigen den Stand der Markenentwicklung. Sortiment,
          Ausführung, Verfügbarkeit und konkrete Standorte sind damit nicht
          verbindlich zugesagt.
        </p>
      </section>
      <section>
        <h2>3. Konto</h2>
        <p>
          Bestehende Konten können zur Verwaltung des eigenen Profils und der
          Warteliste genutzt werden. Neue Registrierungen und Passwort-E-Mails
          sind derzeit deaktiviert. Bitte halte deine Zugangsdaten vertraulich
          und nutze nur dein eigenes Konto.
        </p>
        <p>
          Die Anmeldung zur Warteliste ist freiwillig und vom Konto getrennt.
          Für Fragen zu deinem Konto oder einen Löschungswunsch kannst du uns
          über die im Impressum genannten Wege oder das{" "}
          <Link href="/kontakt">Kontaktformular</Link> erreichen.
        </p>
      </section>
      <section>
        <h2>4. Warteliste</h2>
        <p>
          Ein Eintrag ist kostenlos und setzt ein Konto mit bestätigter
          E-Mail-Adresse sowie deine gesonderte Einwilligung in Informationen
          zum geplanten Markenstart voraus. Der Eintrag ist keine Bestellung,
          Reservierung oder Kaufverpflichtung und garantiert keine bestimmte
          Zuteilung oder Liefermöglichkeit.
        </p>
        <p>
          Du kannst die Einwilligung jederzeit mit Wirkung für die Zukunft im
          Konto durch Abmeldung von der Warteliste oder durch eine Nachricht an
          uns widerrufen. Für die Abmeldung fallen keine Gebühren an.
        </p>
      </section>
      <section>
        <h2>5. Kontakt und Verfügbarkeit</h2>
        <p>
          Das Absenden des Kontaktformulars übermittelt eine Anfrage. Die
          angezeigte Speicherbestätigung ist keine Annahme eines Kaufvertrags.
          Bei technischen Problemen stehen dir auch die im Impressum genannten
          Kontaktwege zur Verfügung.
        </p>
        <p>
          Gesetzliche Ansprüche bleiben unberührt. Mit diesen Hinweisen werden
          keine zusätzlichen Haftungsausschlüsse, Vertragsstrafen oder
          Einschränkungen gesetzlicher Verbraucherrechte vereinbart.
        </p>
      </section>
      <section>
        <h2>6. Datenschutz</h2>
        <p>
          Wie Kontodaten, Kontaktanfragen und Wartelisteneinträge verarbeitet
          werden, erläutert die{" "}
          <Link href="/datenschutz">Datenschutzerklärung</Link>. Informationen
          zu technisch notwendigen Anmeldecookies stehen unter{" "}
          <Link href="/cookies">Cookies</Link>.
        </p>
      </section>
      <section>
        <h2>7. Newsletter</h2>
        <p>
          Die Anmeldung zum Newsletter ist freiwillig und unabhängig von
          Warteliste oder Kontonutzung. Er informiert per E-Mail über die Marke
          und spätere Shop-Angebote. Du kannst deine Einwilligung jederzeit im
          Kundenportal oder durch eine Nachricht zurücknehmen. Der Versand
          beginnt nach Einrichtung des Maildienstes.
        </p>
      </section>
      <section>
        <h2>8. Punktekonto für den späteren Shop</h2>
        <p>
          Das Punktekonto zeigt Gutschriften und Korrekturen nachvollziehbar an.
          Derzeit gibt es keinen festgelegten Geldwert, keine Kaufbonusregel und
          keine Möglichkeit zur Einlösung oder Auszahlung. Ein angezeigter Stand
          stellt keine Bestellung oder Zahlungszusage dar.
        </p>
        <p>
          Vor der Einführung eines verbindlichen Sammel- oder Einlöseprogramms
          werden dessen Regeln und Prämien gesondert bekannt gegeben. Bei einer
          aus deiner Sicht falschen Buchung kannst du uns kontaktieren. Eine
          Korrektur erscheint als eigene Buchung in der Historie.
        </p>
      </section>
      <section>
        <h2>9. Persönliche Rabattcodes für den künftigen Shop</h2>
        <p>
          Bestätigte Kundenkonten erhalten drei einzelne Codes für jeweils 10 %
          ab 50 € Warenwert, einen Code für 15 % ab 150 € und einen Code für 20
          % ab 500 €. Die Aktivierung im Portal ist kostenlos, verbraucht den
          Code nicht und löst keine Bestellung aus. Aktuell ist kein Ablaufdatum
          festgelegt.
        </p>
        <p>
          Jeder Code ist einmal für das zugehörige Kundenkonto vorgesehen. Pro
          Bestellung kann ein Code genutzt werden; eine Kombination der Codes
          ist ausgeschlossen. Der Mindestwarenwert wird vor Anwendung dieses
          Rabatts und ohne Versandkosten ermittelt; Versandkosten werden nicht
          rabattiert. Die technische Einlösung wird erst mit dem späteren
          Checkout verfügbar.
        </p>
      </section>
      <section>
        <h2>10. Konto selbst löschen</h2>
        <p>
          Im Kundenportal kannst du dein Konto nach ausdrücklicher Bestätigung
          endgültig löschen. Profil, Punktehistorie, persönliche Codes,
          Newsletter- und Wartelistendaten werden dabei entfernt; der Zugang
          endet. Eine Wiederherstellung über das Portal ist nicht möglich. Die
          Löschung storniert keine Bestellungen und berührt keine gesetzlichen
          Aufbewahrungspflichten. Einzelheiten findest du im Datenschutz.
        </p>
      </section>
    </LegalPage>
  );
}
