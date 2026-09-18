# Kundenportal – Vorschau

## Umfang

`/konto` bietet persönliche Angaben, Punktestand und Buchungshistorie, eine getrennte Newsletter-Einwilligung, Warteliste sowie Zugang zu Passwortänderung, Kontakt und Datenschutz. Nach erfolgreicher Anmeldung erscheint das vorhandene Kaffee-Intro; reduzierte Bewegung überspringt es. Die Homepage behält ihr ursprüngliches Design.

Die Registrierung benötigt Vorname, Nachname und E-Mail; Telefon ist optional. Der Newsletter ist nicht vorausgewählt. Die Anmeldung neuer Kunden ist für einen bestätigten E-Mail-Link vorbereitet, damit kein zusätzliches Passwortfeld nötig ist. Bestehende Passwortkonten funktionieren weiterhin.

## E-Mail bleibt deaktiviert

`AUTH_EMAIL_ENABLED` bleibt deaktiviert. Registrierung, Anmeldelinks und Passwort-E-Mails werden sowohl in der Oberfläche als auch serverseitig gesperrt. Newsletter-Einwilligungen lassen sich speichern; dieses Projekt versendet noch keine Newsletter.

Vor Aktivierung: eigenen SMTP-Dienst konfigurieren, Absender und Datenschutzhinweise ergänzen, Supabase-Redirect-URLs und `SITE_URL` prüfen und den gesamten Bestätigungs- und Widerrufsablauf testen. Für Bestätigungs-/Magic-Link-Mails kann das Supabase-Template einen Link auf `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` verwenden. Die Bestätigung muss auf die gewünschte Umgebung zeigen. Der Callback unterstützt außerdem den bisherigen PKCE-Code-Austausch. Keine Testmails an echte Kunden senden.

## Administration

Einstieg: `/admin/anmelden`, Benutzername `LACACCINO`. Das generierte Startpasswort liegt ausschließlich in der ignorierten lokalen Datei `artifacts/admin-startpasswort.txt`, niemals im Repository oder Deployment. Supabase hatte das ursprünglich gewünschte Passwort abgelehnt. Beim ersten Login ist ein eigenes Passwort mit mindestens zwölf Zeichen erforderlich.

`/admin` bietet Kundensuche mit jeweils 50 Einträgen, Punktestand, Newsletterstatus und die letzten 30 Kontaktanfragen mit Bearbeitungsstatus. `/admin/kunden/[id]` zeigt Kundendaten, die letzten 30 Buchungen und ein Formular für Gutschriften/Korrekturen. Der Admin kann das eigene Passwort ändern. Kontolöschung und E-Mail-Wechsel laufen zunächst über eine Kontaktanfrage; sie werden nicht automatisch ausgeführt. Eine Wiederherstellung des internen Admin-Kontos erfolgt über einen berechtigten Supabase-Projektverwalter, nicht über E-Mail an die interne technische Adresse.

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

Deployment bleibt eine Vercel-Vorschau auf `design/lacaccino-refinement`. Die additive Datenbankmigration ist bereits angewendet. Öffentliche Freigabe, Mail-Einrichtung und die offenen Anbieterangaben aus `legal-review.md` stehen weiterhin aus.
