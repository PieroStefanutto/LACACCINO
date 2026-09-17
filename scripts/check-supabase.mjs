// Exercise real access policies with disposable accounts; never sends email.
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const config = Object.fromEntries(readFileSync(".env.local", "utf8").split(/\r?\n/).filter(line => /^(SUPABASE_URL|SUPABASE_PUBLISHABLE_KEY|SUPABASE_SECRET_KEY)=/.test(line)).map(line => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SECRET_KEY, options);
const guest = createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, options);
const users = [];
let inquiry;
let rateBucket;
let failed = false;
try {
  for (let i = 0; i < 2; i++) {
    const email = `lacaccino-test-${randomUUID()}@example.com`;
    const password = randomBytes(24).toString("base64url");
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    assert.ok(!created.error, "create disposable user");
    users.push({ id: created.data.user.id });
    const client = createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, options);
    const login = await client.auth.signInWithPassword({ email, password });
    assert.ok(!login.error, "password login");
    users[i].client = client;
  }
  const [alice, bob] = users;
  assert.ok(!(await alice.client.from("profiles").upsert({ id: alice.id, display_name: "Integration test" })).error, "own profile insert");
  const crossRead = await bob.client.from("profiles").select("id").eq("id", alice.id);
  assert.ok(!crossRead.error && crossRead.data.length === 0, "another account cannot read profile");
  assert.ok((await bob.client.from("profiles").upsert({ id: alice.id, display_name: "Forbidden" })).error, "another account cannot overwrite profile");
  assert.ok(!(await alice.client.from("waitlist_entries").upsert({ user_id: alice.id, consent_version: "launch-2026-09-17" }, { onConflict: "user_id", ignoreDuplicates: true })).error, "confirmed user can join waitlist");
  assert.ok(!(await alice.client.from("waitlist_entries").upsert({ user_id: alice.id, consent_version: "launch-2026-09-17" }, { onConflict: "user_id", ignoreDuplicates: true })).error, "duplicate waitlist request is idempotent");
  const hiddenWaitlist = await bob.client.from("waitlist_entries").select("user_id").eq("user_id", alice.id);
  assert.ok(!hiddenWaitlist.error && hiddenWaitlist.data.length === 0, "waitlist entry is private");
  await bob.client.from("waitlist_entries").delete().eq("user_id", alice.id);
  assert.ok((await alice.client.from("waitlist_entries").select("user_id").single()).data, "another account cannot remove waitlist entry");
  assert.ok((await guest.from("contact_requests").select("id")).error, "guest cannot read inquiries");
  assert.ok((await alice.client.from("contact_requests").select("id")).error, "account cannot read inquiries");
  const data = { name: "Integration Test", email: "test@example.com", message: "Disposable integration test request.", consent_version: "contact-2026-09-17" };
  assert.ok((await guest.from("contact_requests").insert(data)).error, "guest cannot bypass server contact validation");
  const saved = await admin.from("contact_requests").insert(data).select("id").single();
  assert.ok(!saved.error, "server can store inquiries");
  inquiry = saved.data.id;
  rateBucket = randomBytes(32).toString("hex");
  assert.ok((await guest.rpc("lacaccino_take_rate_limit", { bucket_key: rateBucket, request_limit: 2 })).error, "guest cannot manipulate rate limit");
  const attempts = await Promise.all(Array.from({ length: 6 }, () => admin.rpc("lacaccino_take_rate_limit", { bucket_key: rateBucket, request_limit: 2 })));
  assert.ok(attempts.every(result => !result.error), "rate limit RPC succeeds");
  assert.equal(attempts.filter(result => result.data === true).length, 2, "rate limit is atomic under concurrency");
  assert.ok(!(await alice.client.from("waitlist_entries").delete().eq("user_id", alice.id)).error, "user can leave waitlist");
  assert.equal((await alice.client.from("waitlist_entries").select("user_id")).data.length, 0, "waitlist entry removed");
  assert.ok(!(await alice.client.auth.signOut()).error, "logout succeeds");
  console.log("PASS: login, profile isolation, confirmed waitlist, idempotency, withdrawal, contact access, concurrent rate limit, logout.");
} catch (error) {
  failed = true;
  console.error(error instanceof assert.AssertionError ? `FAIL: ${error.message}` : "FAIL: Supabase integration request failed (details suppressed).");
} finally {
  if (inquiry && (await admin.from("contact_requests").delete().eq("id", inquiry)).error) failed = true;
  if (rateBucket && (await admin.from("lacaccino_rate_limits").delete().eq("bucket", rateBucket)).error) failed = true;
  for (const user of users) if ((await admin.auth.admin.deleteUser(user.id)).error) failed = true;
  console.log(failed ? "Check failed; verify test-record cleanup in Supabase." : "Disposable test accounts and data removed.");
  process.exitCode = failed ? 1 : 0;
}
