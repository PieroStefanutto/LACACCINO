# Mitarbeiterportal

- Mitarbeiter: `/mitarbeiter` (auch über den Link im Website-Footer).
- Verwaltung: `/admin/mitarbeiter` über den bestehenden Adminzugang.

## Mitarbeiter einrichten

In der Teamverwaltung Namen, bestätigte E-Mail-Adresse, Bruttostundenlohn,
regelmäßige Arbeitstage und Urlaubsanspruch für das ausgewählte Jahr eintragen.
Der Urlaubsanspruch ist ein Gesamtwert einschließlich eines gegebenenfalls
vereinbarten Übertrags. Es wird kein Anspruch automatisch aus gesetzlichen
Mindestwerten abgeleitet.

Ein bestehendes Konto verwendet sein bisheriges Passwort. Für ein neues Konto
wird ein Startpasswort einmalig angezeigt. Dieses persönlich sicher übergeben;
der Mitarbeiter muss beim ersten Zugriff ein eigenes Passwort festlegen.
Es werden weiterhin keine Registrierungs- oder Passwort-E-Mails versendet.
Bei vergessenem Passwort kann der Admin im Mitarbeiterdetail ein neues
Startpasswort erzeugen. Die Zugangsanfrage vorher persönlich prüfen.

## Arbeitszeit und Verdienst

Die Stempeluhr verwendet Serverzeiten. Beginn, Pause, Weiterarbeiten und Ende
sind über Gerätewechsel hinweg gespeichert. Pro Mitarbeiter kann nur eine
Schicht gleichzeitig laufen. Manuelle Nachträge sind für vergangene,
überschneidungsfreie Zeiträume bis 24 Stunden mit Begründung möglich.

Angezeigt wird die Arbeitszeit abzüglich unbezahlter Pausen. Der Verdienst ist
eine Brutto-Schätzung, ohne Steuern, Sozialabgaben, Zuschläge oder bezahlte
Abwesenheiten. Jede Buchung speichert ihren Stundenlohn; spätere Lohnänderungen
ändern bestehende Buchungen nicht. Manuelle Nachträge verwenden den aktuell
eingestellten Stundenlohn. Eine Schicht wird dem Monat ihres Beginns in
Europe/Berlin zugeordnet. Mitarbeiter können Monate oder das ganze Jahr wählen.

Fehlerhafte Buchungen kann der Admin mit Begründung stornieren und danach einen
korrekten Nachtrag erstellen. Der Originaleintrag bleibt sichtbar und zählt
nicht mehr zur Summe. Vor einer Deaktivierung muss eine laufende Schicht beendet
oder vom Admin storniert werden.

## Urlaub und Krankmeldung

Urlaub wird zunächst anhand der hinterlegten Wochentage gezählt. Bei Freigabe
muss der Admin regionale Feiertage, halbe Tage und abweichende Dienstpläne prüfen.
Die anzurechnenden Tage können mit Begründung reduziert werden. Eine Freigabe
kann das Jahreskonto nicht überziehen. Genehmigter Urlaub umfasst genommene und
zukünftig geplante Tage; offene Anträge werden separat angezeigt.

Krankmeldungen enthalten nur den Zeitraum, keine Diagnose und keine Dokumente.
Der Admin bestätigt den Eingang oder stellt eine Rückfrage. Die Meldung ersetzt
keinen erforderlichen AU-Nachweis und ruft keine eAU ab. Kranktage werden nicht
vom Urlaubskonto abgezogen. Jahresübergreifende Meldungen werden aufgeteilt.

Offene Meldungen können Mitarbeiter zurückziehen. Entscheidungen sehen sie im
Verlauf. Der Adminzähler und die Übersichten werden bei sichtbarer Seite jede
Minute aktualisiert; eine manuelle Aktualisierung ist jederzeit möglich.

## Daten und Betrieb

Mitarbeiter sehen nur ihre eigenen Daten. Rollen, Lohnänderungen, Freigaben und
Stornierungen werden serverseitig geprüft und durch Datenbankregeln geschützt.
Die Kundenkonto-Selbstlöschung ist für Mitarbeiterkonten gesperrt. Löschungs- und
Aufbewahrungsfragen müssen mit der Administration unter Berücksichtigung der
Beschäftigungsunterlagen geklärt werden. Deaktivieren ist keine Löschung.

## Prüfen

`npm test` prüft Zeit- und Verdienstberechnung, Urlaubsstände und Zeitumstellung.
`node scripts/check-staff.mjs` prüft die Supabase-Zugriffsregeln und parallele
Buchungen mit automatisch wieder entfernten Testkonten. Für den Browsercheck
zunächst `--keep` übergeben, dann `AGENT_BROWSER_BIN` auf die agent-browser-CLI
setzen und `node scripts/check-staff-browser.mjs <lokale URL>` ausführen.
Danach immer `node scripts/check-staff.mjs --cleanup` ausführen. Die temporären
Zugangsdaten unter `artifacts/` dürfen nicht veröffentlicht werden.
