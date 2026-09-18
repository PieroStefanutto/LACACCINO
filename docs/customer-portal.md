# Kundenportal und Shopvorbereitung

## Umfang

`/konto` bietet persönliche Angaben, Punktestand und Buchungshistorie, eine getrennte Newsletter-Einwilligung, Warteliste sowie Zugang zu Passwortänderung, Kontolöschung, Kontakt und Datenschutz. Eigene Reiter führen zu `/konto/bestellungen`, `/konto/lieblingsprodukte` und `/konto/rabattcodes`. Nach erfolgreicher Anmeldung erscheint das vorhandene Kaffee-Intro; reduzierte Bewegung überspringt es. Die Homepage behält ihr ursprüngliches Design.

Die Registrierung benötigt Vorname, Nachname und E-Mail; Telefon ist optional. Der Newsletter ist nicht vorausgewählt. Die Anmeldung neuer Kunden ist für einen bestätigten E-Mail-Link vorbereitet, damit kein zusätzliches Passwortfeld nötig ist. Bestehende Passwortkonten funktionieren weiterhin.

## E-Mail bleibt deaktiviert

`AUTH_EMAIL_ENABLED` bleibt deaktiviert. Registrierung, Anmeldelinks und Passwort-E-Mails werden sowohl in der Oberfläche als auch serverseitig gesperrt. Newsletter-Einwilligungen lassen sich speichern; dieses Projekt versendet noch keine Newsletter.

Vor Aktivierung: eigenen SMTP-Dienst konfigurieren, Absender und Datenschutzhinweise ergänzen, Supabase-Redirect-URLs und `SITE_URL` prüfen und den gesamten Bestätigungs- und Widerrufsablauf testen. Für Bestätigungs-/Magic-Link-Mails kann das Supabase-Template einen Link auf `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` verwenden. Die Bestätigung muss auf die gewünschte Umgebung zeigen. Der Callback unterstützt außerdem den bisherigen PKCE-Code-Austausch. Keine Testmails an echte Kunden senden.

## Administration

Einstieg: `/admin/anmelden`, Benutzername `LACACCINO`. Das generierte Startpasswort liegt ausschließlich in der ignorierten lokalen Datei `artifacts/admin-startpasswort.txt`, niemals im Repository oder Deployment. Supabase hatte das ursprünglich gewünschte Passwort abgelehnt. Beim ersten Login ist ein eigenes Passwort mit mindestens zwölf Zeichen erforderlich.

`/admin` bietet Kundensuche mit jeweils 50 Einträgen, Punktestand, Newsletterstatus und die letzten 30 Kontaktanfragen mit Bearbeitungsstatus. `/admin/kunden/[id]` zeigt Kundendaten, die letzten 30 Buchungen und ein Formular für Gutschriften/Korrekturen. Der Admin kann das eigene Passwort ändern. E-Mail-Wechsel laufen zunächst über eine Kontaktanfrage. Eine Wiederherstellung des internen Admin-Kontos erfolgt über einen berechtigten Supabase-Projektverwalter, nicht über E-Mail an die interne technische Adresse.

Die Admin-Rolle liegt in einer geschützten Datenbanktabelle, nicht in kundenseitig veränderbaren Metadaten. Alle Admin-Seiten und Aktionen prüfen Rolle und Erstanmeldestatus erneut. Kunden lesen ausschließlich ihre eigenen Daten. Private Antworten werden nicht öffentlich gecacht. Zugangsdaten werden durch Supabase Auth verwaltet, nicht als Klartextpasswort im Website-Code.

## Punkte und Einwilligungen

Migration: `supabase/migrations/20260918180000_customer_portal.sql`. Bestätigte Kunden erhalten ein Punktekonto mit Startwert null. Newsletterstatus und Änderungen werden getrennt mit Zeitpunkt, Quelle und Textversion gespeichert. Die Registrierung aktiviert eine gewählte Einwilligung erst nach E-Mail-Bestätigung.

Punktebuchungen sind atomar, mit Buchungsgrund und Admin-Zuordnung nachvollziehbar und durch einen eindeutigen Buchungsschlüssel gegen Doppelbuchung geschützt. Korrekturen erfolgen als neue Buchung; ein negativer Gesamtstand ist ausgeschlossen. Kunden dürfen weder Guthaben noch Buchungen direkt schreiben. Es gibt derzeit keinen Shop, keine automatische Bestellgutschrift, Einlösung, Auszahlung oder festgelegten Euro-Gegenwert. Diese Regeln und die Anbindung an bezahlte/stornierte Bestellungen folgen erst mit dem Shop.

## Verifikation

- `npm.cmd run lint`, `npm.cmd test`, `npm.cmd run build`
- `node scripts/check-portal.mjs`: temporäre Datenbankkonten, Eigentümerzugriff, Rollen, Einwilligungen, konkurrierende/idempotente Buchungen und Schutz vor negativem Saldo.
- Mit `PORTAL_KEEP_FIXTURES=true` bleiben isolierte Testkonten für Browser- und HTTP-Prüfungen bestehen; danach zwingend `node scripts/check-portal.mjs --cleanup` ausführen. Zugangsdaten liegen nur im ignorierten Artefaktverzeichnis.
- `node scripts/check-admin-http.mjs` gegen den laufenden Build (Standard Port 3103; `CHECK_URL` überschreibbar): Admin-Schutz, wiederholte Buchungen, Kontaktnachrichten und erzwungener Passwortwechsel mit Testadmin.
- `node scripts/check-community-http.mjs`: Anmeldung, Profil, Warteliste, Kontakt, Origin-Schutz und Abmeldung.

Der Stand wird auf ausdrücklichen Wunsch über GitHub `main` in beiden Vercel-Projekten veröffentlicht. Mail-Einrichtung und die offenen Anbieterangaben aus `legal-review.md` stehen weiterhin aus.

## Bestellungen und persönliche Rabattcodes

Migration `20260918210000_portal_shop_preparation.sql` ergänzt Bestellsnapshots, Positionen und Gutscheine. Bestellungen werden ausschließlich durch einen vertrauenswürdigen zukünftigen Shopserver geschrieben; es gibt noch keinen Checkout oder Bestellimport. Kunden lesen per RLS nur eigene Bestellungen und Positionen. Die Historie ist in Seiten zu 20 Bestellungen gegliedert. Lieblingsprodukte werden über eine RLS-geschützte Abfrage aus bezahlten/versandten/abgeschlossenen Bestellungen gruppiert (jeweils 50 Ergebnisse); stornierte und vollständig erstattete Bestellungen sind ausgeschlossen. Teilretouren müssen bei der späteren Shopintegration gesondert abgebildet werden.

Jedes bestätigte Kundenkonto erhält einmal fünf Slots: 3 × 10 % ab 5.000 Cent, 1 × 15 % ab 15.000 Cent, 1 × 20 % ab 50.000 Cent. Der Server erzeugt individuelle Codes. Die Aktivierung prüft Eigentümer und Bestätigungsstatus und ist idempotent. Kunden dürfen weder Codes nacherzeugen noch Rabattstaffeln oder Einlösungsstatus direkt verändern. Administratoren können nicht selbst aktivieren.

`portal_coupon_quote` ist nur für den Service-Zugang aufrufbar und validiert Besitzer, Aktivierung, Mindestwarenwert und Nicht-Einlösung. Die Berechnung nutzt Centbeträge, rundet den Rabatt auf volle Cent ab und schließt Versand aus. Nur einen Gutschein pro Bestellung verwenden. Der tatsächliche Warenwert muss aus vertrauenswürdigen Katalog-/Warenkorbdaten auf dem Server stammen. Die Funktion ist nur eine Preisprüfung: Vor Shopstart müssen eine atomare Reservierung/Einlösung, Zahlungs-Webhooks, Idempotenz sowie Storno-/Erstattungslogik implementiert werden. `redeemed_at` und `redeemed_order_id` sind dafür vorbereitet; die Quote allein reserviert oder verbraucht keinen Code. Keine Einlösungs-API für Browser vorhanden. Aktuell kein Ablaufdatum.

## Selbstbediente Kontolöschung

`/konto/loeschen` erfordert eine angemeldete Kundensitzung, die ausdrückliche Folgenbestätigung und das Wort `LÖSCHEN`. Die Server Action liest ausschließlich die authentifizierte Nutzer-ID; eine gesendete Ziel-ID wird ignoriert. Admin-Konten sind gesperrt. Next.js Origin-Prüfung bleibt aktiv. Erst nach erfolgreicher Supabase-Auth-Löschung werden Cookies entfernt und eine Erfolgsbestätigung angezeigt.

Auth-Löschung entfernt per Fremdschlüssel das Profil, Punkte und Buchungen, Warteliste, Newsletter einschließlich Nachweisen und Gutscheine. Bestellsnapshots bleiben ohne Kontozuordnung erhalten (`ON DELETE SET NULL`); fremde oder alte Sitzungen können sie nicht lesen. Der spätere Checkout muss gesetzliche Belegaufbewahrung und Löschung nach Fristablauf gesondert umsetzen. Der aktuelle Bestellsnapshot enthält keine Rechnungsadresse. Kontaktanfragen sind unabhängige Vorgänge und werden nicht pauschal anhand einer E-Mail-Adresse gelöscht. Hostingprotokolle und Backups unterliegen ebenfalls eigenen Prozessen. Entsprechende Grenzen sind vor der Bestätigung sichtbar.

`node scripts/check-account-services.mjs` prüft Coupon-Anzahl/-Grenzen, Eigentümerschutz, Aktivierung/Wiederholung, Bestell- und Favoritenzugriff, serverseitige Preisprüfung, tatsächliche Kontolöschung, Admin-/Origin-Schutz, Kaskaden und getrennte Bestellaufbewahrung gegen isolierte Testkonten. Standard ist Port 3105 (`CHECK_URL` überschreibbar). Bei `PORTAL_KEEP_FIXTURES=true` anschließend `node scripts/check-account-services.mjs --cleanup` ausführen.
