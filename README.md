# LACACCINO

Eine entstehende Luxusmarke für Coffee to go. Geplanter Marktstart: 2029. Produktbilder sind Designstudien; die sechs Inspirationsorte sind keine Filialankündigungen.

## Entwicklung und Vorschau

Node.js 24 und npm:

```powershell
npm.cmd install
npm.cmd run dev
```

Die Überarbeitung liegt auf `design/lacaccino-refinement`. Vorschauen werden über Vercel bereitgestellt. Die Produktionsprojekte `lacaccino` und `lacaccino-mfw9` bleiben mit GitHub `main` verbunden.

```powershell
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd start
```

## Gestaltung und Bewegung

Creme und Espresso mit zurückhaltenden Champagnerakzenten. Cormorant Garamond und Manrope werden lokal eingebunden. Vorhandene Bilder bleiben unverändert; responsive CSS-Ausschnitte zeigen Becher und Ritual. Die Warteliste und der Marktstart stehen im ersten Bildschirm.

Ein seitlich ziehender Canvas-Sandschleier liegt im Hero-Motiv. Maximal 56 Partikel auf Smartphones, 128 auf Desktop; reduzierte Auflösung und Bildrate auf kleinen Geräten. Er pausiert außerhalb des Sichtfelds und bei inaktivem Tab. Ein kleiner Stern erscheint höchstens alle 16 Sekunden. Reduzierte Bewegung schaltet beide Effekte und Einblendungen ab. Die frühere Intro-Implementierung bleibt im Quellbestand, wird auf der Seite aber nicht mehr eingebunden.

Mobiles Menü und Inspirationskarte verwenden native HTML-Disclosures. Alle Inhalte bleiben ohne Animation lesbar. Das Menü schließt bei Auswahl und mit Escape; die Ortsliste bietet große Tastatur- und Touch-Ziele.

## Konten, Kontakt und Warteliste

`/kontakt` speichert Anfragen in Supabase. `/konto` bietet Anmeldung, privates Profil und die freiwillige Warteliste. Eine bestätigte E-Mail-Adresse ist dafür erforderlich. Die Anmeldung kann im Konto widerrufen werden. Registrierung und Passwort-E-Mails bleiben bis zur späteren SMTP-Einrichtung deaktiviert (`AUTH_EMAIL_ENABLED` ist nicht aktiviert).

Einrichtung und Zugriffsschutz: [docs/supabase-setup.md](docs/supabase-setup.md). Schlüssel gehören ausschließlich in ignorierte lokale Umgebungsdateien oder geschützte Vercel-Variablen. Keine Schlüssel im Browsercode.

## Prüfung

`npm.cmd run check:preview -- http://localhost:3000` prüft HTTP, serverseitige Inhalte, Sprungziele, Bilder und CSS. `scripts/check-community-http.mjs` prüft gegen einen laufenden Produktionsbuild die Serveraktionen für Anmeldung, Profil, Warteliste, Kontakt, Origin-Schutz und Abmeldung. Temporäre Testdaten werden anschließend gelöscht.

Der Designcheck umfasst Desktop (1440 px), Smartphone (390 px), kleine Smartphones (320 px), Menü, Ortswechsel, Formulare und reduzierte Bewegung. Screenshots liegen lokal unter `artifacts/design-review/` und werden nicht hochgeladen.

Die Karte verwendet lokale Natural-Earth-Geometrie aus `world-atlas`. Es werden weder Kartendienste noch externe Schriftserver kontaktiert. Noch offene redaktionelle Angaben stehen in `TODO.md`.
