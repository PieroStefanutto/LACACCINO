// Uses disposable accounts from check-staff.mjs --keep. Never prints credentials.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
const origin = process.argv[2] || "http://localhost:3117";
const binary = process.env.AGENT_BROWSER_BIN || "agent-browser";
const file = "artifacts/staff-fixtures.json",
  records = JSON.parse(readFileSync(file, "utf8"));
const employee = records.find((r) => r.label === "employee"),
  operator = records.find((r) => r.label === "admin");
const service = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
function browser(session, args, input) {
  const r = spawnSync(binary, ["--session", session, ...args], {
    encoding: "utf8",
    input,
    timeout: 60000,
  });
  if (r.status !== 0)
    throw Error(
      `Browser step failed (${args[0]}). Inspect the test browser; credentials omitted.`,
    );
  return r.stdout.trim();
}
function evaluate(session, script) {
  const out = browser(
    session,
    ["eval", "--stdin"],
    `JSON.stringify(${script})`,
  );
  return JSON.parse(JSON.parse(out));
}
const e = "staff-employee",
  a = "staff-admin";
const year = new Date().getFullYear();
await service
  .from("staff_requests")
  .delete()
  .eq("user_id", employee.id)
  .in("starts_on", [`${year}-12-07`, `${year}-12-10`]);
function click(session, text) {
  browser(session, ["find", "role", "button", "click", "--name", text]);
}
function fill(session, selector, value) {
  if (/input\[name=(start|end)\]/.test(selector))
    evaluate(
      session,
      `(()=>{const input=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(String(value))});input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));return input.value;})()`,
    );
  else browser(session, ["fill", selector, String(value)]);
}
async function poll(check, label) {
  for (let n = 0; n < 100; n++) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw Error(label);
}
browser(e, ["open", origin + "/mitarbeiter/anmelden"]);
fill(e, "input[name=email]", employee.email);
fill(e, "input[name=password]", employee.password);
click(e, "Im Mitarbeiterportal anmelden");
browser(e, ["wait", "--url", "**/mitarbeiter"]);
browser(e, ["wait", ".staff-clock-actions"]);
console.log("Employee login verified.");
browser(e, ["set", "viewport", "1440", "1000"]);
assert.ok(
  evaluate(
    e,
    'document.body.textContent.includes("Dein Arbeitstag im Blick.")',
  ),
);
click(e, "Arbeit beginnen");
browser(e, ["wait", ".staff-clock-status"]);
await poll(
  async () =>
    !!(
      await service
        .from("staff_time_entries")
        .select("id")
        .eq("user_id", employee.id)
        .is("ended_at", null)
        .eq("voided", false)
        .maybeSingle()
    ).data,
  "clock start not saved",
);
click(e, "Pause beginnen");
await poll(
  () => evaluate(e, 'document.body.textContent.includes("Du bist in Pause")'),
  "pause not visible",
);
click(e, "Pause beenden");
await poll(
  () =>
    evaluate(
      e,
      'document.body.textContent.includes("Deine Arbeitszeit l\u00e4uft")',
    ),
  "resume not visible",
);
click(e, "Arbeit beenden");
await poll(
  () => !evaluate(e, '!!document.querySelector(".staff-clock-status")'),
  "clock stop not visible",
);
browser(e, ["screenshot", "artifacts/design-review/staff-desktop.png"]);
console.log("Clock flow verified.");
fill(e, "#urlaub input[name=start]", `${year}-12-07`);
fill(e, "#urlaub input[name=end]", `${year}-12-08`);
click(e, "Urlaub beantragen");
await poll(
  async () =>
    !!(
      await service
        .from("staff_requests")
        .select("id")
        .eq("user_id", employee.id)
        .eq("starts_on", `${year}-12-07`)
        .eq("kind", "vacation")
        .maybeSingle()
    ).data,
  "vacation not saved",
);
fill(e, "#krankmeldung input[name=start]", `${year}-12-10`);
fill(e, "#krankmeldung input[name=end]", `${year}-12-11`);
click(e, "Krankmeldung senden");
await poll(
  async () =>
    !!(
      await service
        .from("staff_requests")
        .select("id")
        .eq("user_id", employee.id)
        .eq("starts_on", `${year}-12-10`)
        .eq("kind", "sick")
        .maybeSingle()
    ).data,
  "sick report not saved",
);
browser(e, ["set", "viewport", "390", "844"]);
evaluate(e, 'window.scrollTo({top:0,behavior:"instant"})');
browser(e, ["screenshot", "artifacts/design-review/staff-mobile.png"]);
assert.equal(
  evaluate(e, "document.documentElement.scrollWidth>innerWidth"),
  false,
  "mobile overflow",
);
browser(a, ["--args", "--disable-gpu", "open", origin + "/admin/anmelden"]);
fill(a, "input[name=username]", operator.username);
fill(a, "input[name=password]", operator.password);
click(a, "Administration öffnen");
browser(a, ["wait", "--url", "**/admin"]);
await poll(
  () => evaluate(a, 'location.pathname==="/admin"'),
  "admin login not completed",
);
browser(a, ["open", origin + "/admin/mitarbeiter"]);
browser(a, ["set", "viewport", "1440", "1000"]);
browser(a, ["wait", "#eingang"]);
// Instant scrolling keeps automated clicks on their target while expanding forms.
evaluate(a, 'document.documentElement.style.scrollBehavior="auto"');
await poll(
  () =>
    evaluate(
      a,
      'document.querySelector("#eingang")?.textContent.includes("Portaltest")',
    ),
  "inbox not loaded",
);
console.log("Absence submission and admin inbox verified.");
assert.ok(
  evaluate(
    a,
    'document.querySelector("#eingang").textContent.includes("Portaltest")',
  ),
  "admin inbox must identify employee",
);
const vacation = (
  await service
    .from("staff_requests")
    .select("id")
    .eq("user_id", employee.id)
    .eq("starts_on", `${year}-12-07`)
    .eq("kind", "vacation")
    .single()
).data;
// Open only the test request by its hidden ID, not a position in a live inbox.
evaluate(
  a,
  `(()=>{const input=[...document.querySelectorAll('input[name=request_id]')].find(i=>i.value===${JSON.stringify(vacation.id)});input.closest('details').open=true;input.closest('form').id='test-review';return true;})()`,
);
browser(a, ["select", "#test-review select[name=decision]", "approved"]);
fill(a, "#test-review input[name=reply]", "Freigegeben im Portaltest");
browser(a, ["click", "#test-review button[type=submit]"]);
await poll(
  async () =>
    (
      await service
        .from("staff_requests")
        .select("status")
        .eq("id", vacation.id)
        .single()
    ).data?.status === "approved",
  "approval not saved",
);
browser(e, ["open", origin + "/mitarbeiter"]);
browser(e, ["wait", "#meldungen"]);
await poll(
  () =>
    evaluate(
      e,
      'document.querySelector("#meldungen").textContent.includes("Freigegeben im Portaltest")',
    ),
  "employee decision feedback",
);
browser(a, ["open", origin + "/admin/mitarbeiter"]);
browser(a, ["screenshot", "artifacts/design-review/staff-admin-desktop.png"]);
browser(a, ["wait", "#anlegen"]);
evaluate(a, 'document.documentElement.style.scrollBehavior="auto"');
// Provision one disposable employee through the actual admin form.
const email = `staff-ui-${randomUUID()}@example.com`;
fill(a, "#anlegen input[name=first_name]", "Mara");
fill(a, "#anlegen input[name=last_name]", "Portaltest");
fill(a, "#anlegen input[name=email]", email);
fill(a, "#anlegen input[name=rate]", "19.50");
fill(a, "#anlegen input[name=allowance]", "27");
click(a, "Mitarbeiterzugang anlegen");
browser(a, ["wait", ".staff-credential code"]);
const password = evaluate(
  a,
  'document.querySelector(".staff-credential code").textContent',
);
const person = (
  await service
    .from("staff_members")
    .select("user_id")
    .eq("email", email)
    .single()
).data;
assert.ok(person, "employee provisioned");
const row = { id: person.user_id, label: "ui-created", email, password };
records.push(row);
writeFileSync(file, JSON.stringify(records));
browser("staff-new", [
  "--args",
  "--disable-gpu",
  "open",
  origin + "/mitarbeiter/anmelden",
]);
fill("staff-new", "input[name=email]", email);
fill("staff-new", "input[name=password]", password);
click("staff-new", "Im Mitarbeiterportal anmelden");
browser("staff-new", ["wait", "--url", "**/mitarbeiter/passwort"]);
const newPassword = randomBytes(24).toString("base64url") + "!Aa1";
fill("staff-new", "input[name=password]", newPassword);
fill("staff-new", "input[name=password_confirm]", newPassword);
click("staff-new", "Passwort speichern");
browser("staff-new", ["wait", "--url", "**/mitarbeiter"]);
row.password = newPassword;
writeFileSync(file, JSON.stringify(records));
assert.equal(
  (
    await service
      .from("staff_members")
      .select("must_change_password")
      .eq("user_id", row.id)
      .single()
  ).data.must_change_password,
  false,
  "mandatory password setup completed",
);
for (const session of [e, a, "staff-new"])
  assert.equal(browser(session, ["errors"]), "", "no browser errors");
console.log(
  "PASS: browser login, clock start/pause/resume/stop, vacation/sick submission, admin approval, employee feedback, account provisioning, forced password setup and mobile layout.",
);
