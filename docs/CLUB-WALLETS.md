# Apple Wallet und Google Wallet

Stand: 20.09.2026. **Vorbereitet, nicht freigeschaltet. Kein produktiver Pass wurde ausgestellt.**

## Implementierter Stand

- Gemeinsame Mitgliedschaft und Punktestand aus dem bestehenden Punktejournal.
- QR enthält ausschließlich `LC1:<card_identifier>`. Keine E-Mail, Auth-User-ID, Sitzung oder Wallet-Authentifizierung.
- Stabile Apple-Seriennummer und Google-Objekt-ID; Datenbank erzwingt eine Zuordnung je Mitglied und Anbieter.
- Apple-Store-Card-Daten, Farben, Name, Nummer, Punkte und QR; Signierungsfunktion mit Zertifikatsprüfung und PKPass-Erzeugung.
- Google-Loyalty-Object, RS256-signierter Save-JWT und REST-Update mit stabiler ID, einschließlich Wiederholung nach Create-Konflikt.
- Inaktive Mitgliedschaft: Apple `voided`, Google `INACTIVE`; QR entfällt. Geschlossenes Konto: auch der Name entfällt.
- Private Tabellen für Passzuordnungen, verschlüsselte Tokens, Geräte, Registrierungen und Aktualisierungsaufträge. Kein Kunden- oder Mitarbeiterzugriff.
- Punkte-, Namens-, Sperr- und Löschänderungen erzeugen deduplizierte Update-Aufträge für bereits verknüpfte Pässe. Noch kein laufender Worker.
- Portal zeigt ausschließlich Statushinweise. `walletReadiness()` bleibt gesperrt, auch wenn Umgebungsvariablen gesetzt werden.

Dateien: `lib/club/wallet.ts`, `wallet-signing.ts`, `wallet-provider.server.ts`; Migration `20260920122000_club_wallet_preparation.sql`.

Die Signierungsbibliothek ist auf `passkit-generator@3.6.0` festgelegt. Ihre Joi-Abhängigkeit wird wegen gemeldeter Prototype-Pollution-Lücken auf die korrigierte Patchversion `17.13.6` überschrieben. Npm-Audit ist damit ohne Befund. [Bibliotheksdokumentation](https://github.com/alexandercerutti/passkit-generator/wiki/API-Documentation-Reference)

## Apple: erforderliche Einrichtung

Benötigt werden Apple-Developer-Zugang, Pass Type Identifier, zugehöriges Signierungszertifikat mit privatem Schlüssel, passende WWDR-Kette und freigegebene PNG-Assets. Ein Store-Card-Pass verwendet `storeCard`; gleichbleibender Pass Type Identifier und dieselbe Seriennummer bewahren die Kartenidentität bei Updates. [Apple: Store Card erstellen](https://developer.apple.com/documentation/walletpasses/creating-a-store-card-pass)

| Servervariable | Zweck |
|---|---|
| APPLE_PASS_TYPE_IDENTIFIER | Registrierter Pass-Typ |
| APPLE_TEAM_IDENTIFIER | Team-Zuordnung |
| APPLE_PASS_CERTIFICATE_BASE64 | PEM-Zertifikat, Base64-verpackt |
| APPLE_PASS_PRIVATE_KEY_BASE64 | Privater PEM-Schlüssel, Base64-verpackt |
| APPLE_PASS_PRIVATE_KEY_PASSPHRASE | Falls der Schlüssel geschützt ist |
| APPLE_WWDR_CERTIFICATE_BASE64 | Passende Zwischenzertifikatskette |
| WALLET_WEB_SERVICE_URL | Öffentlicher HTTPS-Update-Dienst |
| WALLET_TOKEN_ENCRYPTION_KEY | Separater Schlüssel für Token-Verschlüsselung |

Werte ausschließlich in serverseitigen Secrets, niemals `NEXT_PUBLIC_*`. Base64 ist **keine Verschlüsselung**. Zugriff und Backups begrenzen; Zertifikatsablauf und Rotation überwachen. Finale PNG-Assets sind noch abzunehmen.

## Apple: noch zu verdrahtender Update-Dienst

Geräteregistrierung/-deregistrierung, Abfrage geänderter Seriennummern und erneuter signierter Download müssen Apples Protokoll implementieren. Registrierung und Passabruf prüfen den separaten ApplePass-Token. Registrierungen sind je Gerät und Pass eindeutig. Update-Tags müssen monoton sein; `If-Modified-Since` und `304` berücksichtigen. APNs meldet Änderungen, anschließend lädt das Gerät den neuen Pass. Token bei Updates stabil halten. [Apple: Update-Protokoll](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Updating.html)

Offen: autorisierter Ausgabe-Endpunkt, Token-Verschlüsselung, Registrierungsrouten, APNs-Anbindung, Queue-Worker mit Sperren/Retry/Überwachung, Rotation und Aufbewahrungsfrist geschlossener Passzuordnungen. Wallet-Token dürfen nur den betreffenden Pass verwalten; niemals Konto oder Punktebuchungen freigeben.

## Google: erforderliche Einrichtung

Benötigt werden Wallet-Issuer-Konto, Cloud-Projekt mit Wallet API, autorisiertes Servicekonto, Loyalty Class und zugelassene Testkonten. Neue Issuer beginnen im Demo-Modus; öffentliche Ausgabe erfordert Publishing Access. [Google: Issuer-Onboarding](https://developers.google.com/wallet/retail/loyalty-cards/getting-started/issuer-onboarding)

| Servervariable | Zweck |
|---|---|
| GOOGLE_WALLET_ISSUER_ID | Issuer-ID |
| GOOGLE_WALLET_CLASS_ID | Vorbereitete Loyalty Class desselben Issuers |
| GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL | Autorisiertes Servicekonto |
| GOOGLE_WALLET_PRIVATE_KEY_BASE64 | Privater RSA-PEM-Schlüssel, Base64-verpackt |
| GOOGLE_WALLET_ALLOWED_ORIGINS | HTTPS-Ursprünge, kommasepariert |

Save-JWTs werden serverseitig signiert. Die Klasse muss Logo und Markendesign enthalten. Wallets bestimmen das endgültige Layout; eine pixelgenaue Kopie der Webkarte ist nicht versprochen. [Google: Save-JWT](https://developers.google.com/wallet/retail/loyalty-cards/use-cases/jwt)

Die vorbereitete Synchronisierung ersetzt das Objekt über seine stabile ID. Der spätere Worker benötigt einen kurzlebigen OAuth-Zugang mit `wallet_object.issuer`-Scope. [Google: Loyalty Object aktualisieren](https://developers.google.com/wallet/reference/rest/v1/loyaltyobject/update)

Offen: Ausgabe-Endpunkt und Passzuordnung, OAuth-Tokenbeschaffung, Queue-Worker, finale Loyalty Class/Assets, echte Update-/Sperrtests. Ein Save-JWT enthält die Kartenanzeige und gehört nicht in öffentliche Logs oder Analytics.

## Testnachweise und Freigabe

**Lokal bestanden:** QR ohne persönliche Daten; gemeinsame Punkte; stabile IDs; inaktive/geschlossene Payloads; private Tabellen; Update-Queue bei Punkteänderung und Löschung; Google-RSA-Signaturprüfung mit flüchtigem Testschlüssel; simuliertes REST-Retry; signiertes Apple-Paket mit fiktiver Test-CA im Arbeitsspeicher; Abweisung falscher Zertifikatsidentität.

**Nicht durchgeführt:** echte Apple-Zertifikate, Simulator/iPhone, Google-Demo-Issuer und Android-Gerät. Der lokale Apple-Test erzeugt **keinen von Apple akzeptierten Pass**.

Vor Freigabe: Ersthinzufügen, erneutes Hinzufügen ohne Duplikat, Punktestandänderung, Verzögerung/Retry, Sperren, Löschen und QR-Identifikation prüfen. Apple-Push-Updates benötigen ein echtes Gerät; Simulator allein genügt nicht. [Apple: Gerätetest](https://developer.apple.com/library/archive/documentation/UserExperience/Conceptual/PassKit_PG/Updating.html)

Bei Google sind die offiziellen Tests mit Testkonten inklusive Hinzufügen, Aktualisieren und Scannen durchzuführen; danach folgt die Publishing-Freigabe. [Google: Pre-launch testing](https://developers.google.com/wallet/retail/loyalty-cards/test-and-go-live/prelaunch-testing), [Google: Launch checklist](https://developers.google.com/wallet/retail/loyalty-cards/test-and-go-live/launch-checklist)

Punktevergabe und Einlösung bleiben auch mit installierter Wallet-Karte ausschließlich berechtigten Mitarbeiteraktionen vorbehalten. Ein alter Offline-Pass ist kein Beweis für einen aktuellen Punktestand.
