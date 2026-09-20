import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

const bin = process.env.AGENT_BROWSER_BIN;
if (!bin)
  throw new Error(
    "Set AGENT_BROWSER_BIN to the installed agent-browser executable.",
  );
const origin = "http://127.0.0.1:3120",
  session = "club-acceptance";
await mkdir("artifacts/club", { recursive: true });
const run = (...args) =>
  execFileSync(bin, ["--session", session, ...args], {
    encoding: "utf8",
    timeout: 45000,
    maxBuffer: 2 * 1024 * 1024,
  }).trim();
function evaluate(code) {
  const out = execFileSync(
    bin,
    ["--session", session, "--json", "eval", "--stdin"],
    { input: code, encoding: "utf8", timeout: 30000 },
  );
  const result = JSON.parse(out);
  if (!result.success) throw new Error(JSON.stringify(result));
  return result.data.result;
}
function open(path, text) {
  run("open", origin + path);
  if (text) run("wait", "--text", text);
  evaluate("document.documentElement.style.scrollBehavior='auto';true");
}
function login(persona) {
  open("/club/anmelden", "Den Club ausprobieren");
  run("select", "[name=persona]", persona);
  run("click", "button[type=submit]");
  run("wait", "--url", "**/club");
  run(
    "wait",
    persona === "mila" || persona === "jonas"
      ? ".club-member-card"
      : ".club-scanner",
  );
}
function noOverflow(label) {
  const dimensions = evaluate(
    "({width:innerWidth,document:document.documentElement.scrollWidth,body:document.body.scrollWidth})",
  );
  assert.ok(
    dimensions.document <= dimensions.width + 1,
    label + ": " + JSON.stringify(dimensions),
  );
}
execFileSync(
  bin,
  [
    "--session",
    session,
    "--args",
    "--disable-gpu",
    "open",
    origin + "/club/anmelden",
  ],
  { stdio: "inherit", timeout: 45000 },
);
run("set", "viewport", "1440", "1000");
login("mila");
assert.equal(evaluate("!!document.querySelector('.coffee-storm')"), false);
noOverflow("desktop");
run("screenshot", "artifacts/club/desktop.png");
open("/club/getraenke", "Ein neues Lieblingsgetränk");
run("fill", "[name=nickname]", "Browser " + Date.now());
run("select", "[name=variant_id]", "60000000-0000-4000-8000-000000000001");
run("click", ".club-columns > section:first-child button[type=submit]");
run("wait", "--text", "Gespeichert. Dein Stand ist aktuell.");
run("reload");
run("wait", "--text", "Bearbeiten");
assert.ok(
  evaluate("document.querySelectorAll('article.club-list-item').length") >= 1,
);
open("/club/profil", "Persönliche Angaben");
run("fill", "[name=phone]", "");
run("click", ".club-columns > section:first-child button[type=submit]");
run("wait", "--text", "Gespeichert. Dein Stand ist aktuell.");
login("jonas");
open("/club/getraenke", "Ein neues Lieblingsgetränk");
assert.equal(
  evaluate("document.querySelectorAll('article.club-list-item').length"),
  0,
);
login("team");
run("fill", "[name=card]", "LC-DEMO-MILA");
run("click", ".club-columns > section:first-child form button[type=submit]");
run("wait", "--text", "Mila B.");
assert.equal(
  evaluate("document.querySelector('video').srcObject"),
  null,
  "Camera must not start without a gesture",
);
assert.equal(
  evaluate("document.querySelector('select option[value=correction]')"),
  null,
);
run("screenshot", "artifacts/club/team.png");
login("admin");
open("/club/admin", "Alles an seinem Platz.");
run("wait", "--text", "Mitglieder");
run("screenshot", "artifacts/club/admin.png");
assert.ok(
  evaluate("document.body.innerText.includes('Aktive Mitgliedschaften')"),
);
login("mila");
run("set", "viewport", "390", "844");
open("/club", "Dein Moment, Mila.");
noOverflow("mobile home");
assert.equal(
  evaluate(
    "getComputedStyle(document.querySelector('.club-mobile-nav')).position",
  ),
  "fixed",
);
run("screenshot", "artifacts/club/mobile.png");
run("click", '.club-mobile-nav a[href="/club/karte"]');
run("wait", "--text", "Bei deinem Besuch vorzeigen.");
noOverflow("mobile card");
const visibility = evaluate(
  "({qr:document.querySelector('.club-card-qr img').getBoundingClientRect().bottom,nav:document.querySelector('.club-mobile-nav').getBoundingClientRect().top})",
);
assert.ok(
  visibility.qr <= visibility.nav,
  "QR must be fully visible above navigation: " + JSON.stringify(visibility),
);
assert.equal(
  evaluate(
    "document.querySelectorAll('.club-wallet-state button, .club-wallet-state a').length",
  ),
  0,
);
run("screenshot", "artifacts/club/card-mobile.png");
run("set", "viewport", "320", "740");
for (const [path, text] of [
  ["/club", "Dein Moment, Mila."],
  ["/club/profil", "Persönliche Angaben"],
  ["/club/vorteile", "Mehr aus deinem Moment."],
]) {
  open(path, text);
  noOverflow("320px " + path);
}
run("set", "viewport", "1440", "1000");
open("/club", "Dein Moment, Mila.");
run("press", "Tab");
assert.equal(
  evaluate("document.activeElement?.textContent?.trim()"),
  "Zum Inhalt",
);
run("press", "Enter");
const errors = run("errors");
assert.equal(errors, "", "Browser errors: " + errors);
const report = {
  checkedAt: new Date().toISOString(),
  passed: true,
  desktop: "1440x1000",
  mobile: ["390x844", "320x740"],
  tested: [
    "role selection",
    "favourite save and reload",
    "profile save",
    "second customer isolation",
    "staff lookup",
    "camera stays off",
    "admin view",
    "mobile navigation",
    "QR visibility",
    "no inactive Wallet buttons",
    "keyboard skip link",
    "no horizontal overflow",
    "no browser errors",
  ],
  notTested: [
    "real Supabase Auth/MFA/email",
    "physical QR camera",
    "Apple Wallet on iPhone",
    "Google Wallet on Android",
  ],
};
await writeFile(
  "artifacts/club/browser-results.json",
  JSON.stringify(report, null, 2),
);
console.log(report);
