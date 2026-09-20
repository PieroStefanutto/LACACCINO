# Club: Architektur, Betrieb und offene Entscheidungen

## Umgebungen

- `off` ist Standard. Markenwebsite, `/konto`, `/mitarbeiter` und `/admin` bleiben bestehen.
- `npm.cmd run dev:club` bindet an `127.0.0.1:3120`, setzt lokale Demo und überschreibt Supabase-/Mailvariablen im Kindprozess mit leeren Werten. Die vorhandene `.env.local` wird nicht verändert.
- PGlite läuft auf dem Server. Daten: `artifacts/club-demo/database-<Schemahash>`. Schema-/Seedänderungen bekommen einen neuen Ordner; frühere fiktive Daten bleiben erhalten.
- Die sichtbare Testrollenauswahl ist **keine Auth-Lösung**. Sie verwendet ein HttpOnly-/SameSite-Cookie und ist in Production, Vercel oder bei nicht lokalem Host gesperrt.
- Vorschau braucht ein **separates** Supabase-Projekt: `APP_ENV=preview`, `CLUB_MODE=supabase`, passende `CLUB_SUPABASE_PROJECT_REF`, Site-URL und eigene Schlüssel. Das bisherige produktive Projekt wird zusätzlich abgewiesen.
- Produktionsfreigabe des Clubs ist in dieser Etappe nicht implementiert. Gesetzte Variablen allein aktivieren sie nicht.

## Datenbank und Anmeldung

Die fünf bestehenden Migrationen bleiben unverändert. Vier zusätzliche Migrationen erweitern Mitgliedschaften, Sortiment, Treueprogramm, Inhalte, Rollen und Wallet-Vorbereitung. **Keine neue Migration wurde auf Supabase angewendet.**

Die lokale Datenbank führt alle Migrationen aus. `supabase/demo/bootstrap.sql` simuliert nur die Auth-Umgebung. Echte SQL-Funktionen, Constraints und RLS werden ausgeführt. Der Seed liegt getrennt vom Migrationsordner und verlangt einen ausschließlich lokalen Marker.

Für die echte Vorschau werden bestehende Supabase-Funktionen verwendet: Passwortanmeldung, bestätigender E-Mail-Link, Registrierung und Recovery. Rücksprünge sind auf bekannte lokale Routen begrenzt. E-Mail-Funktionen bleiben mit `AUTH_EMAIL_ENABLED=false` gesperrt. Keine eigene Passwortverschlüsselung.

Privilegierte Club-RPCs verlangen `aal2` und aktuelle Admin-/Standortrechte. TOTP-Einrichtung/Bestätigung nutzt Supabase. Der bisherige HR-/Adminbereich ist noch nicht vollständig auf MFA umgestellt und muss vor gemeinsamer Echtbetriebsfreigabe vereinheitlicht werden. [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [MFA/TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp)

## Rollen und Buchungen

| Rolle | Club-Rechte |
|---|---|
| Kunde | Eigene Karte, Profil, Vorlieben, Buchungen, Reservierungen, Events, Nachrichten, Export, Löschanfrage |
| Mitarbeiter | Exakte Karten-/Nummernsuche, Belegbuchung und Prämienausgabe am zugeordneten Standort |
| Standortleitung | Zusätzlich begründete Korrektur/Stornierung am zugeordneten Standort |
| Administrator | Club-Verwaltung und Service; kein editierbares Rollenfeld im Kundenprofil |

Mitarbeiterkonten werden weiterhin in der Personalverwaltung angelegt, Club-Rechte zusätzlich je Standort vergeben. Die Suche zeigt nur Vorname/Nachnamensinitial, Kartennummer, Status, Punkte und reservierte Prämien; keine E-Mail/Telefonnummer.

Das vorhandene Punktejournal wird weiterverwendet. Typen: Vergabe, Einlösung, Korrektur, Storno. Der ältere Admin-Buchungsendpunkt kann nach Migration keine Club-Konten mehr buchen.

Die Datenbank berechnet Punkte aus einem Centbetrag und einer freigegebenen Standortregel. Manuelle Mitarbeiterbestätigung ist erforderlich. Belegreferenzen sind je Standort eindeutig; Request-IDs prüfen Wiederholungen und geänderte Nutzlasten. Zeilensperren schützen den Saldo. Reservierung bucht atomar ab, Ausgabe verbraucht einmal, Storno bucht einmal zurück.

Keine automatische Kasse, kein festgelegter Euro-Gegenwert, keine endgültige Ablaufregel. Demo-Regeln sind ausschließlich fiktiv. Die früher gewünschten Shop-Rabatte bleiben im bestehenden Modul und sind keine Club-Treueregel.

## Sicherheit und Datenschutz

- RLS auf Club-Tabellen; eigene Daten über serverseitige Identität. Keine browserseitige Ziel-User-ID.
- Explizite RPCs; keine direkten Schreibrechte für Punkte, Rollen, Kartenkennungen und Prämien.
- Standort-/Rollen-/MFA-Prüfung in der Datenbank. Begrenzung sensibler Vorgänge auch direkt auf RPC-Ebene; HTTP zusätzlich mit Origin-, Eingabe- und Größenprüfung.
- Kundendaten/Downloads: `private, no-store`. Keine Schlüssel in clientseitigen Variablen. Kamera erst nach Bedienhandlung.
- Noch keine privaten Uploads. Später: private Buckets, Eigentümer-RLS, MIME-/Größenprüfung und kurzlebige autorisierte Downloads.
- Marketing freiwillig, getrennt und anfangs aus. Consent-Tabelle speichert Zeit, Version und Widerruf. Abmeldung verhindert weitere Marketinganzeigen. Noch kein Mail-Worker oder Push-Abonnement.
- E-Mail-Änderung noch offen. Geburtstag wird ohne bestätigte Geburtstagsfunktion nicht erhoben.
- JSON-Export: Clubdaten, vollständiges Punktejournal, Newsletter-Nachweise, Warteliste, verknüpfte Bestellungen/Positionen, Codes und Nachrichten. Unverknüpfte Kontaktvorgänge, Logs, Backups und HR-Daten gesondert prüfen.

## Löschung und Wiederherstellung

Der Club stellt eine idempotente Löschungsanfrage bereit. Administration kann Bearbeitung markieren. Das ist **keine Kontolöschung**. Endgültiger Bearbeitungsworkflow und Aufbewahrungsfristen sind noch festzulegen.

Die bisherige Selbstlöschung unter `/konto/loeschen` bleibt erhalten. Auth-Löschung entfernt abhängige Profile, Einwilligungen, Vorlieben und Kundenbuchungen gemäß bestehender Kaskaden. Mitgliedschaft bleibt geschlossen ohne User-Zuordnung; Wallet-Update wird vorgemerkt. Bestellsnapshots/Prämien verlieren ihre Kontoverknüpfung. Mitarbeiterkonten sind von Selbstlöschung ausgeschlossen.

Welche Buchungs-/Einwilligungsnachweise wie lange aufzubewahren sind, muss geprüft werden. Keine verbindlichen Fristen wurden erfunden. Aufbewahrung verbleibender Kartenkennungen ist offen. Ein vorgemerkter Wallet-Job ist noch keine an Geräte ausgelieferte Sperre.

Sicherungskonzept:

1. Vor genehmigter Migration verschlüsseltes Backup der richtigen Umgebung; Code- und Migrationsstand dokumentieren.
2. Anbieterbackup/PITR nach tatsächlich gebuchtem Supabase-Tarif prüfen. Verschlüsselte Exporte und Wiederherstellungszugriff festlegen; Tarif nicht ungeprüft als ausreichend betrachten.
3. Private Dateien und Wallet-Schlüssel separat sichern; Zugriff und Rotation beschränken.
4. Restore zuerst in isoliertes Testprojekt. RLS, Rollen, Saldo, Auth, Sperren und Jobs prüfen.
5. Erst nach Abnahme umschalten. Externe Jobs beim Restore pausieren; Idempotenz gegen Doppelverarbeitung prüfen.

**Kein produktiver Restore durchgeführt.** RPO/RTO, Fristen, Verantwortliche und regelmäßige Restore-Übung sind Betreiberentscheidungen.

## Fehlende Verbindungen und Geschäftsentscheidungen

| Bereich | Noch erforderlich |
|---|---|
| Supabase-Vorschau | Eigenes Testprojekt, Schlüssel, Freigabe der Migrationen |
| Mail | Anbieter/SMTP, Absender, Domainprüfung, Templates, Zustell-/Recovery-Tests |
| Wallets | Konten, Zertifikate, Assets, Ausgabe-/Update-Dienst und offizielle Gerätetests; siehe CLUB-WALLETS.md |
| Standorte | Bestätigte Cafés, Adresse, Koordinaten, Öffnungszeiten; sechs Visionen bleiben getrennt |
| Sortiment | Echte Getränke, erlaubte Kombinationen und Verfügbarkeit |
| Treueprogramm | Wirtschaftlich freigegebene Regeln, Prämien, Bedingungen, Fristen, Kassenprozess |
| Rechtliches | Betreiber-E-Mail, Anbieterangaben, Consent-Texte, Aufbewahrung/Löschung, Schlichtungsfrage |
| Inhalte | Echte Meldungen, Events, Termine, Kapazitäten und Bildrechte |
| Verkauf | Preise, Steuern, Bestand, Versand, Abholfenster, Storno/Erstattung, Gutschein-/Abo-Bedingungen |

## Verkaufsmodule

Vorbestellung, Shop, digitale Geschenkgutscheine und Abos sind nur als deaktivierte Modulgrenzen dargestellt. **Kein Checkout, keine Stripe-Zahlung implementiert oder getestet.** Bestehende Bestellhistorie/Coupons bleiben erhalten.

Nach Geschäftsfreigabe: ausschließlich Stripe-Testmodus, serverseitige Preise/Rabatte, Bestands-/Abholreservierungen, validierte Webhooks mit eindeutigen Event-IDs, Zustandsübergänge, Freigabe reservierter Mengen nach Zahlungsfehler und idempotente Erstattung implementieren. Eine Erfolgsseite bestätigt keine Zahlung; keine Kartendaten selbst speichern. Diese Etappe ist offen.
