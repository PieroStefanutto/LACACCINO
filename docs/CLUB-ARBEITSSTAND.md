# LACACCINO Club – Arbeitsstand

Stand: 20. September 2026. Lokaler Entwicklungszweig `feature/lacaccino-club-local`.

## Auftrag und Grenzen

Die öffentliche Markenwebsite und das bestehende Kunden-/Mitarbeiterportal bleiben erhalten. Keine Veröffentlichung, kein Push, keine produktive Migration. Der Betreiber hat bestätigt: Es gibt noch kein separates Supabase-Testprojekt; zunächst ausschließlich lokal arbeiten.

## Gesicherter Ausgangspunkt

- Basis-Commit: `80da693`.
- Einzige vorhandene nicht eingecheckte Änderung: `TODO.md`; bleibt unangetastet. Sicherung: `artifacts/club-baseline/user-changes.patch` (ignoriert).
- SHA-256 der ursprünglichen TODO: `AF5917CA8E5D946F497B4CB78288581E5A5DD021741C52699D9473482D2DEB79`.
- Git-Identität ist vorhanden; keine Identität erfunden.
- Next.js 16.3.5, React 19.3.0, TypeScript; Supabase JS 2.116.0 und SSR. Bestehende Pakete und Framework bleiben erhalten.
- Bereits vorhanden: bestätigte Supabase-Konten, Profile, Newsletter-Einwilligungsprotokoll, Kontakt/Warteliste, Admin, Punktejournal, vorbereitete Shop-Rabatte, Bestellhistorie und HR-Zeiterfassung/Abwesenheiten.
- Laut bestehender Projektkonfiguration und README ist Vercel mit GitHub verbunden; `main` bedient die Produktionsprojekte. Pushes können Deployments auslösen. Der erneute schreibgeschützte Vercel-API-Abruf beider Projekte lieferte `INVALID_ARGUMENT`; aktuelle Plattform-Einstellungen wurden daher nicht unabhängig bestätigt. Es wurde keinerlei Push ausgeführt.
- `.env.local` gehört zum bestehenden Echtbetrieb. Bestehende HTTP-/Supabase-Prüfskripte dürfen nicht ungeprüft gegen diese Datenbank ausgeführt werden.
- Kein Docker/psql verfügbar. Neue SQL-Prüfungen laufen in lokalem PostgreSQL-WASM (PGlite), nicht in der produktiven Datenbank. Auth wird dabei ausschließlich für fiktive Testpersonen simuliert.

## Etappen

1. Bestand und Sicherung: erledigt.
2. Designsystem, isolierte Entwicklung, Datenmodell: lokal umgesetzt; echte Auth-/Mail-/MFA-Abnahme blockiert.
3. Club, Karte, Profil, Favoriten: lokal umgesetzt und geprüft.
4. Treueprogramm und Mitarbeiterbuchung: lokal umgesetzt und geprüft; keine Kassenintegration.
5. Administration: lokale Grundverwaltung umgesetzt; vollständiger Löschabschluss und weitere Betriebsfunktionen offen.
6. Verkaufsmodule: deaktivierte Grenzen vorbereitet, Transaktionsbackend offen. Wallet: Datenmodell, Signierung und Update-Primitiven vorbereitet; Ausgabe-/Update-Dienst und Anbietertests offen.
7. Lokale Prüfungen und Dokumentation: siehe Nachweise unten.

Ein lokal bestandener SQL-Test ersetzt weder Supabase-Auth-Integrationstests noch einen Mehrverbindungstest unter PostgreSQL oder die offiziellen Wallet-Gerätetests.

## Funktionsübersicht

`Demo` bedeutet hier: funktionsfähiger Ablauf mit persistenten, ausschließlich fiktiven lokalen Daten; keine echte Authentifizierung oder externe Verbindung.

| Funktion | Status | Grenze |
|---|---|---|
| Öffentliche Website, Kontakt, Warteliste, bisheriges Konto und HR-Portal | funktionsfähig (Bestand) | Erhalten; bestehende produktive Abläufe nicht erneut mit realen Daten getestet |
| Club-Design, mobile Navigation, Zustandsanzeigen | funktionsfähig | Lokal auf Desktop und Smartphone geprüft, kein Intro |
| Registrierung, Mailbestätigung, Recovery | blockiert | Supabase-Code vorhanden; getrenntes Testprojekt/SMTP fehlen |
| Echte Club-Sitzung und MFA | vorbereitet | Auth-Anbieter verwendet; nur simulierte Testrollen lokal, echter MFA-Abnahmelauf fehlt |
| Mitgliedskarte mit QR | Demo | Zufällige, eigenständige Kennung; kein Kontozugriff durch QR |
| Profil, Newsletter-Widerruf, JSON-Export | Demo | Eigene Daten; E-Mail-Änderung und umfassender Betreiber-Auskunftsprozess offen |
| Löschungsanfrage + Admin-Bearbeitungsanzeige | Demo | Keine automatische finale Löschung im neuen Club |
| Punktejournal, Belegvergaben, Korrektur/Storno | Demo | Regeln nur fiktiv; kein POS oder automatischer Kaufnachweis |
| Prämienreservierung, Ausgabe, Rückbuchung | Demo | Atomare SQL-Funktionen; echte Mehrverbindungs-Lastprüfung fehlt |
| Lieblingsgetränke und verfügbare Kombinationen | Demo | Mehrere Vorlieben, Bearbeiten/Löschen; Änderungen des Sortiments sichtbar |
| Standorte, lokale Karte, Anfahrtslink | Demo | Nur fiktive Testcafés; Visionen klar getrennt |
| Neuigkeiten/Events mit Kapazität | Demo | Entwurf/Veröffentlichung, An-/Abmeldung; keine echten Events |
| Benachrichtigungsübersicht | Demo | Deduplizierte Kontonachrichten, Marketingtrennung; kein Mail-Worker |
| Mitarbeiter-Service und manuelle Suche | Demo | Standortrechte, minimale Kundenansicht, Audit |
| QR-Kamera | vorbereitet | Nur expliziter Start, Browser-API mit manueller Alternative; echter Kameratest offen |
| Admin-Mitglieder, Standorte, Sortiment, Regeln, Prämien, Inhalte, Standortrollen | Demo | Grundverwaltung; Listen teilweise auf 100/200 Einträge begrenzt |
| Admin-Kennzahlen | Demo | SQL-basierte Werte mit Definition/30-Tage-Zeitraum |
| Rabattaktionen | vorbereitet | Informationsinhalte; vorhandene Shop-Codes separat; keine neue atomare Aktions-Einlösung |
| Apple Wallet / Google Wallet | vorbereitet | Signiercode, stabile IDs, Status-/Punktequeue; keine Karten ausgeliefert |
| Vorbestellung, Shop, Geschenkgutscheine, Abos | vorbereitet | Deaktivierte Modulgrenzen; Checkout/Stripe/Bestand/Webhooks noch offen |
| Private Dateiablage | vorbereitet | Keine Uploadfunktion; Zugriffskonzept dokumentiert |
| Sicherung/Wiederherstellung | vorbereitet | Konzept vorhanden; echter Restore-Test offen |

## Lokale Nachweise

- Typprüfung und Produktionsbuild erfolgreich.
- ESLint ohne Fehler.
- Unit-/SQL-Tests: **32 Tests bestanden**. Echte Migrationen in PGlite, zwei Kunden, RLS, Rollen/MFA-Abweisung, Idempotenz, Negativsaldo, Prämienkonflikte, Eventkapazität, Wallet-Privatheit und Status-Queue.
- HTTP-Abnahme: **52 Prüfungen bestanden**; Bericht `artifacts/club-http-results.json`.
- Browser: **1440 × 1000**, **390 × 844**, **320 × 740**. Favorit speichern/erneut laden, Profil, zweites Konto, Mitarbeitersuche, Admin, Navigation, vollständiger QR, Tastatur-Sprunglink, kein Überlauf und keine Browserfehler. `artifacts/club/browser-results.json`.
- Wallet-Signierung: Google-RSA-Signatur und simulierte API-Wiederholung; Apple-Paket mit kurzlebiger fiktiver Test-CA erzeugt. Keine Aussage zur Apple-/Google-Abnahme.
- Abhängigkeitsaudit: ohne Befund nach Joi-Patchoverride.
- TODO-Prüfsumme weiterhin identisch; nichts veröffentlicht.

## Fortsetzung

1. Separates Supabase-Testprojekt bereitstellen und dessen Verwendung bestätigen. Ausschließlich dort Migrationen anwenden; Demo-Seed niemals übertragen.
2. Auth/Recovery/MFA mit echten Testkonten und Mailanbieter Ende zu Ende prüfen, Rollen des bestehenden HR-/Adminbereichs vereinheitlichen.
3. SQL unter echtem PostgreSQL mit parallelen Verbindungen prüfen. Schema, Indexierung und seitenweise Adminlisten für größere Mengen abnehmen.
4. Regeln, Standorte, Sortiment und Betreiber-/Rechtstexte freigeben; Löschabschluss und Aufbewahrung umsetzen.
5. Wallet-Ausgabe/Registrierungsdienste und Worker fertigstellen; offizielle Tests aus `CLUB-WALLETS.md` durchführen.
6. Verkauf erst nach ausdrücklich freigegebenen Regeln im Testmodus implementieren. Danach gesonderte Freigabe für Echtbetrieb und Veröffentlichung.

Die erste lokale Ausbaustufe ist benutzbar. Der vollständige Auftrag ist damit **noch nicht abgeschlossen**; die offenen Module sind bewusst nicht als einsatzbereit bezeichnet.
