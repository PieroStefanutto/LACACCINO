import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const base = process.env.CHECK_URL || "http://localhost:3100";
const config = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter(line => /^(SUPABASE_URL|SUPABASE_SECRET_KEY)=/.test(line)).map(line => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `lacaccino-http-${randomUUID()}@example.com`;
const password = randomBytes(24).toString("base64url");
let userId;
const cookies = new Map();
function decode(value) { return value.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">"); }
function fields(html, marker) {
  const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(match => match[0]).find(value => value.includes(marker));
  assert.ok(form, `form ${marker} exists`);
  const data = new FormData();
  for (const input of form.matchAll(/<input\b[^>]*>/g)) {
    if (!input[0].includes('type="hidden"')) continue;
    const name = input[0].match(/name="([^"]+)"/)?.[1];
    if (name) data.append(decode(name), decode(input[0].match(/value="([^"]*)"/)?.[1] || ""));
  }
  return data;
}
async function request(path, data, foreignOrigin = false) {
  const result = await fetch(new URL(path, base), { method: data ? "POST" : "GET", redirect: "manual", headers: { cookie: [...cookies].map(([name, value]) => `${name}=${value}`).join("; "), ...(data ? { origin: foreignOrigin ? "https://untrusted.example" : new URL(base).origin } : {}) }, ...(data ? { body: data } : {}) });
  for (const cookie of result.headers.getSetCookie()) {
    const pair = cookie.split(";")[0];
    cookies.set(pair.slice(0, pair.indexOf("=")), pair.slice(pair.indexOf("=") + 1));
  }
  return { response: result, html: await result.text() };
}

try {
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ok(!created.error, "create disposable account without sending email");
  userId = created.data.user.id;
  let page = await request("/konto");
  const login = fields(page.html, 'id="auth-email"');
  login.set("email", email); login.set("password", password); login.set("mode", "login");
  let submitted = await request("/konto", login);
  assert.equal(submitted.response.status, 303, "login action redirects");
  page = await request("/konto");
  assert.ok(page.html.includes(email), "authenticated account renders verified email");
  assert.ok(page.response.headers.get("cache-control")?.includes("no-store"), "production account response cannot be cached");
  const profile = fields(page.html, 'id="profile-name"'); profile.set("display_name", "HTTP test profile");
  await request("/konto", profile);
  assert.equal((await admin.from("profiles").select("display_name").eq("id", userId).single()).data?.display_name, "HTTP test profile", "profile action persists");
  page = await request("/konto");
  const join = fields(page.html, 'name="intent"'); join.set("intent", "join"); join.set("consent", "yes");
  await request("/konto", join);
  assert.ok((await admin.from("waitlist_entries").select("user_id").eq("user_id", userId).maybeSingle()).data, "waitlist action persists");
  page = await request("/konto");
  const leave = fields(page.html, 'name="intent"'); leave.set("intent", "leave");
  await request("/konto", leave);
  assert.equal((await admin.from("waitlist_entries").select("user_id").eq("user_id", userId).maybeSingle()).data, null, "waitlist withdrawal persists");
  page = await request("/kontakt");
  const contact = fields(page.html, 'id="contact-name"');
  contact.set("name", "HTTP Integration Test"); contact.set("email", email); contact.set("message", "Disposable HTTP test message."); contact.set("consent", "yes");
  submitted = await request("/kontakt", contact);
  assert.ok(submitted.html.includes("Deine Anfrage wurde gespeichert"), "contact action confirms storage");
  assert.equal((await admin.from("contact_requests").select("id").eq("email", email)).data?.length, 1, "one inquiry stored");
  const spoofed = await request("/kontakt", contact, true);
  assert.ok(spoofed.response.status >= 400, "foreign-origin form submission rejected");
  assert.equal((await admin.from("contact_requests").select("id").eq("email", email)).data?.length, 1, "rejected request did not store inquiry");
  page = await request("/konto");
  const logout = fields(page.html, "Abmelden</button>");
  submitted = await request("/konto", logout);
  assert.equal(submitted.response.status, 303, "logout redirects");
  page = await request("/konto");
  assert.ok(!page.html.includes(email) && page.html.includes('id="auth-email"'), "logout removes session");
  console.log("PASS: real HTTP server actions for login, private account, profile, waitlist, withdrawal, contact, origin rejection and logout.");
} catch (error) {
  console.error(error instanceof assert.AssertionError ? `FAIL: ${error.message}` : "FAIL: HTTP integration request failed (details suppressed).");
  process.exitCode = 1;
} finally {
  const deletion = await admin.from("contact_requests").delete().eq("email", email);
  const userDeletion = userId ? await admin.auth.admin.deleteUser(userId) : null;
  if (deletion.error || userDeletion?.error) { console.error("Test cleanup requires attention."); process.exitCode = 1; }
  else console.log("Disposable HTTP test data removed.");
}
