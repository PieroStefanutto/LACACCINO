# LACACCINO: Supabase und Vercel

## Funktionen

- `/konto`: Registrierung, Anmeldung, E-Mail-Bestätigung, Profil, Abmeldung und freiwillige Warteliste für 2029.
- `/konto/passwort`: Passwort ändern, auch nach einer Wiederherstellung per E-Mail.
- `/kontakt`: Anfragen speichern; im Supabase Table Editor unter `contact_requests` bearbeiten.
- Die Warteliste setzt ein Konto mit bestätigter Adresse voraus. Anmeldung und Widerruf sind im Konto möglich. Es wird kein Newsletter automatisch verschickt.

## Konfiguration

Diese Werte werden ausschließlich serverseitig gelesen. Lokal in `.env.local`, auf Vercel als Umgebungsvariablen eintragen. Keine Schlüssel in Git oder Chat kopieren.

```dotenv
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=publishable_or_legacy_anon_key
SUPABASE_SECRET_KEY=secret_or_legacy_service_role_key
SITE_URL=https://YOUR_PRODUCTION_DOMAIN
AUTH_EMAIL_ENABLED=false
```

`SUPABASE_SECRET_KEY` gehört ausschließlich auf den Server. Kein `NEXT_PUBLIC_`-Präfix verwenden. Der Schlüssel dient Kontaktanfragen und dem zentralen Rate Limit. Profile und Warteliste verwenden die angemeldete Sitzung mit Row Level Security.

## Datenbank

Vorhandene Tabellen prüfen, dann das Projekt verknüpfen und die Migration anwenden:

```powershell
npx.cmd supabase link --project-ref PROJECT_REF
npx.cmd supabase db push --dry-run
npx.cmd supabase db push
```

Kein `db reset` gegen die produktive Datenbank ausführen. Die Migration legt neue Tabellen an; Namenskonflikte brechen die Transaktion ab.

In Supabase Auth E-Mail/Passwort und E-Mail-Bestätigung aktivieren. Die Site URL auf die Produktionsdomain setzen. Als erlaubte Redirect-URL `https://YOUR_PRODUCTION_DOMAIN/auth/callback` einschließlich der Passwort-Variante `https://YOUR_PRODUCTION_DOMAIN/auth/callback?next=/konto/passwort` eintragen. Lokal entsprechend `http://localhost:3000` verwenden. Bestätigungs- und Wiederherstellungslinks im selben Browser öffnen, in dem sie angefordert wurden (PKCE).

Supabase benötigt einen produktiv eingerichteten Mailversand für Bestätigungen und Passwort-Resets. Den tatsächlich konfigurierten Versand sowie die Zustellung an externe Adressen prüfen; der Standard-Testversand ist eingeschränkt.
Nach Einrichtung und Zustellprüfung `AUTH_EMAIL_ENABLED=true` in der Produktionsumgebung setzen und neu deployen. Bis dahin bleiben Registrierung und Passwort-Reset gesperrt; die Anmeldung bestehender Konten, Kontaktanfragen und die Wartelistenverwaltung funktionieren unabhängig davon.

## Betrieb und Prüfung

`npm.cmd test`, `npm.cmd run lint` und `npm.cmd run build` prüfen den Code. Zusätzlich mit zwei getrennten Testkonten prüfen: Bestätigung, Anmelden, Profil, Warteliste beitreten/verlassen, Passwort-Reset und Abmelden. Ein Konto darf weder Profil noch Wartelisteneintrag eines anderen Kontos lesen oder ändern. Anonyme Aufrufe dürfen keine Kontaktanfragen lesen oder direkt schreiben.

`node scripts/check-supabase.mjs` prüft Zugriffsregeln mit kurzlebigen Auth-Benutzern. `node scripts/check-community-http.mjs` prüft echte Server-Action-Formulare gegen einen laufenden Produktionsserver auf Port 3100 (anderes Ziel über `CHECK_URL`). Beide Skripte benötigen die lokale Supabase-Konfiguration, erzeugen eindeutig benannte Testdaten und entfernen sie anschließend. Sie versenden keine E-Mails. Bestätigungs- und Wiederherstellungs-E-Mails müssen nach der späteren SMTP-Einrichtung gesondert getestet werden.

Der Supabase-Sicherheitsberater weist auf die bewusst für angemeldete Benutzer ausführbare Funktion `lacaccino_email_confirmed()` hin. Sie akzeptiert keine Parameter, verwendet einen festen Suchpfad und gibt ausschließlich zurück, ob die Adresse des aufrufenden Benutzers bestätigt wurde. Diese Prüfung wird von der Wartelisten-Insert-Policy benötigt.

Kontaktanfragen bleiben im Table Editor; es gibt keine automatische E-Mail an den Betreiber. Geschlossene Anfragen nach der notwendigen Bearbeitungsdauer löschen. Beim Löschen eines Auth-Benutzers werden Profil und Wartelisteneintrag mitgelöscht.

Vor dem öffentlichen Betrieb die bestehenden offenen Anbieter- und Datenschutzangaben aus `TODO.md` ergänzen und um Supabase, den tatsächlichen Mailanbieter, Konten, Anfragen und die freiwillige Warteliste erweitern. Dieser technische Hinweis ersetzt keine Datenschutzerklärung.

Das Rate Limit arbeitet datenbankweit pro gehashter IP und Stunde: fünf Kontaktanfragen bzw. Registrierungen/Resets, 30 Anmeldeversuche. Alte Rate-Limit-Einträge werden bei Aufrufen nach zwei Stunden entfernt. Die Vercel-eigene IP-Kopfzeile verhindert einfaches Umgehen über `X-Forwarded-For`; lokal teilen sich Aufrufe einen Test-Bucket.
