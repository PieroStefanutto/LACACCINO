// Creates only fictional, password-protected accounts in the authorized test project.
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  testEnvironment,
  value,
  TEST_PROJECT_REF,
} from "./club-test-support.mjs";
const { service } = testEnvironment();
const file = "artifacts/club-staging/preview-accounts.json";
const saved = existsSync(file)
  ? JSON.parse(await readFile(file, "utf8"))
  : null;
if (saved && saved.project !== TEST_PROJECT_REF)
  throw new Error("Test project mismatch.");
const entries = saved?.accounts || [];
for (const role of ["kunde", "admin"]) {
  if (entries.some((entry) => entry.role === role)) continue;
  const email = `${role}@club-test.example`;
  const password = randomBytes(24).toString("base64url") + "!Aa9";
  const result = await value(
    service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: role === "kunde" ? "Piero" : "Admin",
        last_name: "Testkonto",
        fictional: true,
        account_version: "club-preview-2026-09-20",
      },
    }),
  );
  entries.push({ role, id: result.user.id, email, password });
  await mkdir("artifacts/club-staging", { recursive: true });
  // Persist immediately so a partial provisioning never loses its credentials.
  await writeFile(
    file,
    JSON.stringify({ project: TEST_PROJECT_REF, accounts: entries }, null, 2),
    { mode: 0o600 },
  );
}
const administrator = entries.find((entry) => entry.role === "admin");
await value(
  service
    .from("portal_admins")
    .upsert({
      user_id: administrator.id,
      username: "CLUB-TEST",
      must_change_password: false,
    }),
);
await writeFile(
  "artifacts/club-test-zugang.txt",
  [
    "LACACCINO Club - getrennte Testumgebung",
    process.env.SITE_URL + "/club/anmelden",
    "",
    ...entries.flatMap((e) => [
      e.role === "kunde" ? "KUNDENKARTE" : "ADMINISTRATION",
      "E-Mail: " + e.email,
      "Passwort: " + e.password,
      "",
    ]),
    "Die Konten gelten nur in der Testumgebung. Keine echten Daten eingeben.",
    "Der Adminzugang funktioniert mit E-Mail und Passwort ohne Authenticator-App.",
    'Auf dem Kundenkonto unter Start einmal "Meine Mitgliedskarte erstellen" waehlen, falls die Karte noch nicht angelegt ist.',
    "Keine Registrierung und keine Passwort-E-Mails, solange SMTP fehlt.",
    "Diese Datei bleibt lokal und wird nicht auf GitHub oder Vercel hochgeladen.",
  ].join("\n"),
  { mode: 0o600 },
);
console.log(
  "Two fictional preview accounts ready. Credentials saved locally; no emails sent.",
);
