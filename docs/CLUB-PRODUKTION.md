# LACACCINO Club: Produktionsfreischaltung

Stand: 20.09.2026. Der Betreiber hat die Freischaltung auf der Hauptwebsite ausdrücklich beauftragt.

Aktualisierung auf Betreiberwunsch: Alle LACACCINO-Zugänge funktionieren ohne Authenticator-App. Migration `20260920150000_club_password_access.sql` entfernt die AAL2-Pflicht und behält bestätigte Konten, Passwortwechselpflicht, Rollen- und Standortrechte bei. Die Authenticator-Oberfläche und ihre aktiven API-Endpunkte wurden entfernt; TOTP-Einrichtung und -Bestätigung sind in Test- und Produktionsprojekt deaktiviert. Es wurden keine bestehenden Passwörter oder Konten geändert. Die Anmeldung der Supabase-/Vercel-Betreiberkonten ist davon unabhängig.

## Datenbank und Sicherung

- Bestehende Produktionsdatenbank `midxwtzhytzvbmidpvsl`, keine Umschaltung auf das Testprojekt.
- Die fünf ausstehenden, zuvor auf Supabase getesteten Club-Migrationen wurden angewendet. Insgesamt zehn Migrationen; alle 36 Anwendungstabellen verwenden RLS.
- Vorher: 17 Anwendungstabellen, zwei bestehende Auth-Konten (Administrator und Mitarbeiter), keine Kundenkonten. Die originalen Zeilen und Spaltenwerte aller 17 Tabellen wurden anschließend mit dem Sicherungsstand verglichen: unverändert.
- Keine Demo-Datensätze, Beispielstandorte, Prämien oder wirtschaftlichen Regeln übernommen.
- `scripts/backup-club-production.ps1` sichert 53 Tabellen aus public, auth, storage und supabase_migrations sowie öffentliche Funktionsdefinitionen, Spalten, Constraints, Indizes, Trigger, Richtlinien und Rechte in einem konsistenten SQL-Schnappschuss.
- Der Schnappschuss ist mit Windows CurrentUser DPAPI verschlüsselt; Entschlüsselung und SHA-256-Vergleich wurden geprüft. Dateien und Manifest liegen ausschließlich im ignorierten Ordner `artifacts/club-production`. Aufbewahrung und Zugriff sind an dieses Windows-Konto gebunden.
- Das ist ein logischer JSON-Schnappschuss, kein vollständiges pg_dump-/PITR-Backup. Ein vollständiger Restore einschließlich Supabase-Systemdiensten wurde nicht getestet. Storage-Dateiinhalte sind nicht enthalten; das Projekt verwendet bisher keine privaten Uploads.

## Freischaltung und Zugang

Beide Vercel-Projekte erhalten ausschließlich in Production: `APP_ENV=production`, `CLUB_MODE=supabase`, `CLUB_PRODUCTION_ENABLED=true`, die produktive Projekt-Referenz und je ihre eigene `SITE_URL`. Die vorhandenen serverseitigen Schlüssel bleiben erhalten. Preview-Konfiguration und Testkonten bleiben getrennt.

- Hauptadresse: `https://lacaccino.vercel.app/club`
- Zweite bestehende Adresse: `https://lacaccino-mfw9.vercel.app/club`
- Kundenkarte: `/club/karte`; ein bestätigtes Kundenkonto kann seine Mitgliedschaft selbst anlegen.
- Administration: bisherige Anmeldung `/admin/anmelden` mit Benutzername und Passwort, anschließend „Club-Administration“. Es wird kein Authenticator-Code verlangt.
- Mitarbeiter: bisheriger Personalzugang, anschließend „Club-Service“. Standortberechtigungen werden in der Club-Administration vergeben. Zeiterfassung und Abwesenheiten bleiben im bisherigen Personalbereich.
- Hauptnavigation und Footer verlinken den Club. Das bisherige Kundenportal verlinkt direkt zur Karte und bleibt für Warteliste, Rabattcodes und Bestellhistorie erhalten.

Admin- und Mitarbeiterkonten bekommen keine Kundenkarte. Für die persönliche Karte wird ein separates Kundenkonto benötigt. Testvorschau-Zugangsdaten gelten nicht in Production.

## Bewusst noch nicht aktiviert

- Registrierung, E-Mail-Anmeldung und Passwort-E-Mails bleiben mit `AUTH_EMAIL_ENABLED=false` deaktiviert, bis eigener Mailversand und Zustellung geprüft sind. Bestehende Passwort-Anmeldungen funktionieren.
- Apple Wallet und Google Wallet: Anbieterzugänge, Zertifikate, vollständiger Ausgabedienst und offizielle Gerätetests fehlen. Keine aktiven Hinzufügen-Schaltflächen.
- Verkauf, Zahlungen, Gutscheinkauf und Abos bleiben deaktiviert. Standortdaten, Sortiment und Treuebedingungen müssen vom Betreiber festgelegt werden.
- Finale Löschbearbeitung, Aufbewahrung, rechtliche Angaben und die weiteren offenen Punkte aus `CLUB-BETRIEB.md` bleiben offen. Keine Behauptung vollständiger rechtlicher oder funktionaler Produktionsreife.

## Prüfung und Rückweg

Build einschließlich Typprüfung, ESLint und 32 lokale Tests bestanden. Die Produktionsfreigabe akzeptiert ausschließlich die migrierte Produktionsdatenbank und den expliziten Freigabeschalter; Preview-/Demo-Werte aktivieren sie nicht. Die 34 echten Supabase-Integrationstests der Testumgebung sind in `CLUB-TESTPROJEKT.md` dokumentiert.

Beide Vercel-Produktionsdeployments des Anwendungsstands `1195628` sind READY und über die Hauptadressen öffentlich erreichbar, ohne Vercel-Vorschau-Anmeldung. Geprüft: echte Passwortanmeldung, Kartenerstellung, dieselbe Karte auf beiden Adressen, mobiler Einstieg von der Homepage, Verbindung zum bisherigen Konto, Abmeldung, Desktop 1440 × 1000 und Smartphone 390 × 844. Kein horizontaler Überlauf; der QR-Code liegt vollständig über der unteren Navigation. Keine JavaScript-Fehler oder Runtime-Error-Einträge in beiden geprüften Deployments.

Die ursprüngliche Freigabe enthielt einen erfolgreichen MFA-Test. Diese Anmeldeart wurde anschließend auf ausdrücklichen Betreiberwunsch ersetzt. Für die aktuelle Passwortanmeldung: 33 lokale Tests, 38 echte Supabase-Integrationstests, Build/Typprüfung und ESLint erfolgreich. Insbesondere Kundenabweisung, Rollenauflösung, initialer Passwortwechsel, inaktive Mitarbeiter und fehlende Standortzuordnungen wurden geprüft. Die Auth-Umstellung wird zusätzlich online mit kurzlebigen Prüfnutzern abgenommen; Nachweis: `artifacts/club-password-access`. Für das eigene Kundenkonto bleibt eine separate Betreiber-E-Mail-Adresse angefragt.

Nachweise und Screenshots: `artifacts/club-production/card-desktop.png`, `card-mobile.png`, `home-mobile-menu.png`, `runtime-errors.json` und `release-results.json`. Die Screenshots zeigen die inzwischen gelöschte Prüfkarte.

Rückweg: `CLUB_PRODUCTION_ENABLED=false` für beide Produktionsprojekte setzen und neu veröffentlichen, alternativ die vorherige Vercel-Produktion wiederherstellen. Die additiven Tabellen können zunächst bestehen bleiben. Keine automatische Datenbank-Rückwärtsmigration oder Löschung; produktive Club-Buchungen würden sonst verloren gehen. Wiederherstellung gezielt und zuerst in isolierter Umgebung prüfen.
