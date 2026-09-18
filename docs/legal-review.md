# Rechtstexte – Vorschau, 18. September 2026

## Grundlage

Der Inhaber hat bestätigt, dass Dächle und LACACCINO sein Unternehmen sind, und die Übernahme der Anbieterangaben beauftragt.
Quelle: https://www.daechlelauffen.de/impressum.html

Übernommen: Inhaber, Geschäftsbezeichnung, Postanschrift, Telefon, Fax und Aufsichtsbehörde (bezogen auf den Dächle-Betrieb).
Die fremde Fotolia-Bildangabe, pauschale Haftungsausschlüsse und die dortige Datenschutzerklärung wurden nicht übernommen: Sie beschreiben nicht die LACACCINO-Website.

## Noch vor öffentlicher Freigabe zu erledigen

- Geschäftliche E-Mail-Adresse fehlt in der Quelle und wurde angefragt. Ein Kontaktformular ersetzt die Pflichtangabe nach § 5 DDG nicht. Solange die Adresse fehlt, zeigen Impressum und Datenschutz einen Vorschauhinweis.
- USt-IdNr., Wirtschafts-Identifikationsnummer und Registereintrag laut Antwort des Inhabers vorerst nicht vorhanden. Keine Angaben erfunden.
- Verbraucherschlichtung laut Inhaber ungeklärt: Teilnahmeverpflichtung/-bereitschaft und gegebenenfalls Beschäftigtenzahl zum Vorjahresende klären, dann Information nach § 36 VSBG ergänzen. Keine pauschale Nichtteilnahme behauptet.
- Auftragsverarbeitungsverträge, konkrete Vercel-Tarifabdeckung, Transfergarantien und Unterauftragnehmer bestätigen. Der öffentlich verlinkte Vercel-DPA nennt Pro/Enterprise; seine Geltung für diesen Vertrag wurde nicht nachgewiesen. Keine Vertragsannahme oder kostenpflichtige Änderung vorgenommen.
- Tatsächliche Hosting-/Auth-Protokollfristen und betriebliche Bearbeitung von Löschungsanfragen festlegen. Die Website besitzt keine allgemeine automatische Löschroutine für Kontaktanfragen und Konten; die Erklärung behauptet deshalb keine festen oder automatischen Löschfristen.
- Rechtstexte vor öffentlicher Verwendung fachlich prüfen lassen. Dies ist eine auf den untersuchten Code abgestimmte redaktionelle Umsetzung, keine Bestätigung vollständiger Rechtskonformität.

## Umfang der AGB-Seite

Es gibt keine Bezahlfunktion und keinen Warenverkauf. Die Seite erläutert kostenloses Konto, Warteliste und Markenentwürfe, ohne neue Haftungsausschlüsse oder eine rückwirkende AGB-Zustimmung bestehender Konten zu fingieren. Vor einem Shopstart sind Verkaufs-AGB, Verbraucherinformationen, Widerruf, Preise/Versand und gegebenenfalls BFSG-Pflichten auf das tatsächliche Geschäftsmodell abzustimmen.

## Technischer Abgleich

- Supabase SSR: HttpOnly, SameSite=Lax, Secure im Produktionsbetrieb, Auth-Cookie-Maximaldauer laut installierter Bibliothek 400 Tage. Keine optionale Analyse-/Werbetechnik im aktiven Code.
- Supabase-Datenbank laut bestehender Einrichtung: EU West / Irland. Globale Anbieterzugriffe werden nicht ausgeschlossen.
- Kontaktformular verlangt ausdrückliche Bestätigung; vorhandene Einwilligungsversion und Datenbankschema bleiben erhalten. Datenschutzlink und Widerrufshinweis ergänzt.
- Warteliste verlangt ein bestätigtes Konto und eine getrennte Einwilligung. Abmeldung löscht den aktiven Datensatz.
- Rate Limit speichert einen HMAC-Wert, keine Klartext-IP. Löschung alter Zeitfenster beim nächsten Funktionsaufruf, nicht automatisch nach exakt zwei Stunden.
- E-Mail-Registrierung und Passwortversand bleiben deaktiviert. Vor Freischaltung Versanddienst und Datenschutzhinweise ergänzen.
- Rechtliche Links stehen durch das Root-Layout auf Start-, Kontakt-, Konto-, Passwort- und Rechteseiten.
- Ursprüngliches dunkles Design wiederhergestellt. Das dekorative Intro verwendet nur einen Status im laufenden JavaScript-Modul; kein Session Storage, Local Storage oder Cookie. Nach vollständigem Neuladen kann es erneut spielen. Das vermeidet zusätzlichen Geräte-Speicher allein für einen dekorativen Effekt.

## Validierung

Build, Lint und acht vorhandene Tests erfolgreich. HTTP-Prüfung von Inhalten, Bildern und Sprungzielen bestanden. Anmeldung, Profil, Wartelisteneintrag/-abmeldung, Kontakt, Origin-Schutz und Logout gegen den Produktionsbuild erfolgreich getestet; Testdaten gelöscht. Mobile Rechtsseiten ohne horizontalen Überlauf, globale Rechtslinks mit mindestens 44 Pixel hohen Touch-Zielen. Keine Browserfehler. Öffentliche Startseite in frischem Browser ohne Cookie, Local-Storage- oder Session-Storage-Einträge.

## Geprüfte Primärquellen

- Anbieter: https://www.daechlelauffen.de/impressum.html
- § 5 DDG: https://www.gesetze-im-internet.de/ddg/__5.html
- § 25 TDDDG: https://www.gesetze-im-internet.de/ttdsg/__25.html
- § 36 VSBG: https://www.gesetze-im-internet.de/vsbg/__36.html
- DSGVO/BfDI: https://www.bfdi.bund.de/SharedDocs/Downloads/DE/Broschueren/INFO1.pdf
- Vercel DPA: https://vercel.com/legal/dpa
- Supabase DPA: https://supabase.com/legal/dpa
- Beschwerderecht: https://www.baden-wuerttemberg.datenschutz.de/beschwerde/
- Eingestellte EU-OS-Plattform (kein veralteter Pflichtlink eingebaut): https://consumer-redress.ec.europa.eu/site-relocation_en
- BFSG-Anwendungsbereich: https://www.gesetze-im-internet.de/bfsg/__1.html
