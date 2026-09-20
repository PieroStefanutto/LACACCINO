# Club-Testprojekt: Einrichtung und Abnahme

Stand: 20.09.2026. Der Betreiber hat das neu angelegte Projekt ausdrücklich für die Club-Tests bereitgestellt.

- Supabase: `lacaccino-club-test`, Referenz `cilstsrnidvmtcugjyns`, Region `eu-west-1`.
- Ausgangspunkt: 0 Tabellen in `public`, 0 Auth-Konten.
- Alle neun versionierten Migrationen wurden mit expliziter Testprojekt-Referenz angewendet. Kein Demo-Bootstrap, kein lokaler Demo-Seed übertragen.
- 36 Anwendungstabellen mit aktiviertem RLS. Rechte kommen ausdrücklich aus den Migrationen.
- Das bestehende Produktionsprojekt `midxwtzhytzvbmidpvsl`, dessen lokale Verknüpfung und `.env.local` bleiben unverändert.
- Vercel-Projekt `lacaccino`: acht Variablen ausschließlich für **Preview und Git-Zweig `club-test`**. Produktionsvariablen bleiben unverändert.
- Adresse für die Vorschau: `https://lacaccino-git-club-test-piero-stefanutto-ai.vercel.app/club/anmelden`.

## Anmeldung und Zugang

Die Vorschau verwendet echte Supabase-Sitzungen und serverseitig bestätigte Nutzer. Keine frei wählbaren Testrollen. Sie zeigt einen dauerhaften Hinweis auf die getrennte Testumgebung.

Zwei fiktive Konten für die manuelle Abnahme wurden angelegt: Kunde und Administrator. Ihre zufälligen Passwörter liegen nur lokal in `artifacts/club-test-zugang.txt` und `artifacts/club-staging/preview-accounts.json`. Beide Pfade sind von Git und Vercel-Uploads ausgeschlossen. Das Admin-Konto benötigt zusätzlich TOTP. Es hat keine Rechte im Produktionsprojekt.

Registrierung, E-Mail-Links und Passwort-E-Mails bleiben mit `AUTH_EMAIL_ENABLED=false` gesperrt. Die Auth-Site-URL und zulässige Callback-URLs verweisen auf die Vorschau; Mindestpasswortlänge ist 12. Der spätere SMTP-Versand wurde nicht eingerichtet.

## Reproduzierbare Prüfung

`.env.club-test.local` ist eine ausschließlich lokale, ignorierte Datei mit dem Testprojekt und seinen eigenen Schlüsseln. Sie wird nicht automatisch von Next.js geladen. `scripts/club-test-support.mjs` prüft die exakte Projektadresse und Referenz, bevor Integrationstests schreiben dürfen.

~~~powershell
node scripts/check-club-supabase.mjs
~~~

34 Prüfungen erfolgreich: echte Anmeldung, Supabase-TOTP/AAL2, zwei getrennte Kunden, eigene Mitgliedskarte, direkte API-/Rollen-/Punktemanipulation, Favoriten, Einwilligungsprotokoll, Standortrechte, minimale Mitarbeitersuche, idempotente Belege, parallele Reservierung/Ausgabe, negative Salden, Korrekturrechte, Eventkapazität, Export, Löschanfrage und gesperrte Mitgliedschaft.

Bestätigung und Recovery wurden mit **providerseitig erzeugten Testlinks ohne E-Mail-Versand** geprüft, einschließlich einmaliger Verwendung und Passwortwechsel. Das ersetzt keinen Test der späteren Mailzustellung oder des öffentlichen Registrierungsformulars.

Die parallelen Prüfungen verwenden echte gleichzeitige PostgREST-Anfragen gegen PostgreSQL. Nur eindeutig zu diesem Testlauf gehörende fiktive Datensätze werden angelegt und anschließend entfernt. Das lokale Demo-Seed wird nicht verwendet. Bericht: `artifacts/club-staging/supabase-results.json`.

`scripts/provision-club-preview.mjs` stellt die beiden dauerhaften manuellen Testkonten bereit und erhält bereits gespeicherte Passwörter. Automatische Prüfungen sind bewusst nicht Teil von `npm test`, weil sie das externe Testprojekt verändern.

## Noch offen vor dem Echtbetrieb

Mailanbieter und Zustellprüfung; geprüfte Übernahme der Migrationen in das bestehende Produktionsprojekt; Freischaltung und Verlinkung des Clubs; noch offene Funktionen und Geschäftsregeln aus `CLUB-ARBEITSSTAND.md`. Wallets und Verkauf bleiben deaktiviert. Dieses Testprojekt ersetzt keine bestehende Produktionsdatenbank.
