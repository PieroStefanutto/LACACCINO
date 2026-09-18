# LACACCINO

## Website und Datenbank

Die Website ist über GitHub `main` mit den Vercel-Projekten `lacaccino` und `lacaccino-mfw9` verbunden. Hauptadresse: https://lacaccino.vercel.app.

Neu: `/kontakt` speichert Anfragen in Supabase, `/konto` bietet Anmeldung, ein privates Profil und die freiwillige Warteliste für den Markenstart 2029. Die Warteliste verlangt eine bestätigte E-Mail-Adresse und lässt sich im Konto wieder verlassen. Registrierung und Passwort-E-Mails bleiben bis zur späteren SMTP-Einrichtung gesperrt (`AUTH_EMAIL_ENABLED`).

Einrichtung, Zugriffsschutz und Betrieb stehen in [docs/supabase-setup.md](docs/supabase-setup.md). Projektschlüssel liegen ausschließlich in ignorierten lokalen Umgebungsdateien und geschützten Vercel-Variablen.

Lokale Next.js-Markenwebsite für eine entstehende Luxusmarke für Kaffee to go. Geplanter Markenstart: 2029. Alle Produktbilder sind Designkonzepte; die sechs Orte sind Zukunftsvisionen, keine Filialankündigungen.

## Lokal ansehen

Voraussetzung: Node.js 24 und npm. PowerShell im Projektordner öffnen:

```powershell
npm.cmd install
npm.cmd run dev
```

Dann `http://localhost:3000` öffnen. Falls Port 3000 bereits belegt ist, die im Terminal ausgegebene Adresse verwenden. Beenden mit `Strg+C`.

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd start
```

`start` führt den zuvor gebauten Produktionsstand aus.

Bei laufender Website prüft `npm.cmd run check:preview` in einem zweiten Terminal den HTTP-Aufruf, den serverseitigen Inhalt, interne Sprungziele und die tatsächliche Auslieferung aller eingebundenen Produktbilder und Stylesheets. Dies ist ein technischer Abruf, keine Browser-Bedienungsprüfung.

## Animation und Bedienung

- Optionales Canvas-Intro: 5,4 Sekunden, stumm, stilisierte Bohnen und Staub. Keine Videodatei oder aufwendige 3D-Szene. Überspringen per sichtbarem Button, Escape, Tab, Scrollen oder Klick. Die Seite lädt unabhängig darunter.
- Das Intro merkt sich seine Wiedergabe nur im Arbeitsspeicher der laufenden Seite. Es schreibt weder Cookies noch Local/Session Storage. Ein vollständiges Neuladen kann es erneut abspielen.
- Bei reduzierter Bewegung, deaktiviertem JavaScript oder Canvas-Problemen erscheint die Seite direkt. Ein separater Zeitwächter entfernt das Intro spätestens nach 5,8 Sekunden Laufzeit. Langsames Nachladen wird nach 1,4 Sekunden abgebrochen, ohne die Seite zu verdecken.
- Goldstaub an der Wortmarke und ein einzelner, sanfter Stern alle fünf Sekunden. Keine schnellen Blitze. Partikelzahl und Auflösung sind auf Smartphones begrenzt; Effekte pausieren außerhalb des sichtbaren Bereichs und bei verstecktem Browser-Tab. Ein laufendes Intro endet beim Tabwechsel.
- Native Web Animations API für Einblendungen und Lichtbewegungen; Canvas 2D für Partikel. Keine zusätzliche Animationsbibliothek. Auf Smartphones und bei reduzierter Bewegung wird die Ritualfolge ohne Sticky-Bildwechsel dargestellt.
- Das mobile Menü ist ein natives HTML-Disclosure und funktioniert auch ohne JavaScript. Mit JavaScript schließen Auswahl und Escape das Menü.
- Karte und Ortsliste sind per Tastatur bedienbar (Tab, Enter oder Leertaste). Der Europa-Ausschnitt macht eng beieinanderliegende Punkte besser auswählbar; die Ortsliste bietet große Touch-Ziele.

## Bilder und Karte

Die 13 Originalbilder in `public/images` bleiben unverändert. `next/image` liefert passende Größen und moderne Bildformate aus. Bildflächen haben feste Seitenverhältnisse. Die Karte verwendet lokal installierte Natural-Earth-Geometrie aus `world-atlas` (Public Domain); `d3-geo` und `topojson-client` berechnen die SVG-Pfade auf dem Server. Zur Laufzeit wird kein Kartendienst kontaktiert.

Es gibt keine Tracker, extern geladenen Schriften, Audio-Autoplay, Preise oder Bestellfunktionen. Offene Kontakt- und Rechtstextangaben sowie die spätere Filmproduktion stehen in `TODO.md`.

## Stand der Prüfung

`npm.cmd test` prüft den Canvas-Renderer isoliert: Dauer und Auflösung, Abbruch, Ende bei inaktivem Tab, Renderingfehler und mobile Ressourcenbegrenzung. Diese Tests sind keine Browserprüfung.

Für den manuellen Abnahmelauf: Desktop und Smartphone, Intro überspringen, erneut laden, reduzierte Bewegung, Tastaturnavigation, Menü und alle sechs Kartenorte durchgehen. Für die Prüfung ohne JavaScript die Website mit deaktiviertem JavaScript neu laden: alle Hauptinhalte sollen sichtbar bleiben. In der Arbeitsumgebung war kein Browser verbunden; Screenshots und diese Bedienungsprüfungen konnten daher nicht automatisiert durchgeführt werden.

## Rechtliche Informationen

Impressum, Datenschutz, AGB/Nutzungshinweise und Cookie-Information sind über den globalen Footer erreichbar. Die Anbieterangaben stammen aus dem Dächle-Impressum. Fehlende Angaben und betriebliche Prüfpunkte sind in [docs/legal-review.md](docs/legal-review.md) dokumentiert. Die Seiten bleiben bis zur Klärung in der Vorschau. Das ursprüngliche dunkle Design wurde auf Wunsch wiederhergestellt.

## Kundenportal und Administration

Das Kundenportal unter `/konto` enthält Profil, Newsletter-Einwilligung, Warteliste und ein vorbereitetes Punktekonto. `/admin/anmelden` führt zur geschützten Kunden- und Punkteverwaltung. Details zu E-Mail-Freischaltung, Admin-Zugang und Prüfungen: [docs/customer-portal.md](docs/customer-portal.md). Desktop- und Smartphone-Ansichten sowie die wichtigsten Abläufe wurden für diese Erweiterung im Browser geprüft.
