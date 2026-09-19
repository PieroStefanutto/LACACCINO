import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  options,
);
const file = "artifacts/staff-fixtures.json";
const records = [];
async function cleanup(rows) {
  for (const row of [...rows].reverse()) {
    const member = await service
      .from("staff_members")
      .delete()
      .eq("user_id", row.id);
    assert.ok(!member.error, "remove disposable staff");
    const user = await service.auth.admin.deleteUser(row.id);
    assert.ok(!user.error, "remove disposable auth account");
  }
}
if (process.argv.includes("--cleanup")) {
  if (existsSync(file)) {
    await cleanup(JSON.parse(readFileSync(file, "utf8")));
    unlinkSync(file);
  }
  console.log("Staff fixtures removed.");
  process.exit(0);
}
if (existsSync(file)) throw Error("Clean existing staff fixtures first.");
async function account(label) {
  const email = `staff-${label}-${randomUUID()}@example.com`,
    password = randomBytes(24).toString("base64url") + "!Aa1";
  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  assert.ok(!error, "create disposable account");
  const row = { label, email, password, id: data.user.id };
  records.push(row);
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  assert.ok(!(await client.auth.signInWithPassword({ email, password })).error);
  return { ...row, client };
}
let keep = false;
try {
  const alice = await account("employee"),
    bob = await account("other"),
    customer = await account("customer"),
    operator = await account("admin");
  const username = `STAFF-TEST-${randomUUID()}`.toUpperCase();
  records.find((r) => r.id === operator.id).username = username;
  assert.ok(
    !(
      await service
        .from("portal_admins")
        .insert({ user_id: operator.id, username, must_change_password: false })
    ).error,
  );
  const configure = (id, rate = 1800, year = 2029, days = 3) =>
    operator.client.rpc("staff_configure", {
      target_user: id,
      given_name: id === alice.id ? "Lea" : "Ben",
      family_name: "Portaltest",
      rate_cents: rate,
      weekdays: [1, 2, 3, 4, 5],
      allowance_year: year,
      allowance_days: days,
      enabled: true,
    });
  for (const person of [alice, bob])
    assert.ok(!(await configure(person.id)).error, "admin provisions staff");
  assert.ok(
    (
      await alice.client.rpc("staff_clock", {
        operation: "start",
        entry_id: randomUUID(),
      })
    ).error,
    "initial password blocks work functions",
  );
  assert.ok(
    !(
      await service
        .from("staff_members")
        .update({ must_change_password: false })
        .in("user_id", [alice.id, bob.id])
    ).error,
  );
  assert.equal(
    (await alice.client.from("staff_members").select("*").eq("user_id", bob.id))
      .data.length,
    0,
    "colleague wage hidden",
  );
  assert.ok(
    (
      await alice.client
        .from("staff_members")
        .update({ hourly_cents: 99999 })
        .eq("user_id", alice.id)
    ).error,
    "self-awarded pay denied",
  );
  assert.ok(
    (
      await customer.client.rpc("staff_clock", {
        operation: "start",
        entry_id: randomUUID(),
      })
    ).error,
    "customer cannot clock",
  );
  assert.ok(
    (
      await alice.client.rpc("staff_configure", {
        target_user: alice.id,
        given_name: "A",
        family_name: "B",
        rate_cents: 99999,
        weekdays: [1],
        allowance_year: 2029,
        allowance_days: 300,
        enabled: true,
      })
    ).error,
    "employee cannot configure role or leave",
  );
  assert.ok(
    (
      await alice.client.rpc("staff_find_account", {
        account_email: operator.email,
      })
    ).error,
    "auth directory unavailable to staff",
  );
  const clock = (op, id) =>
    alice.client.rpc("staff_clock", { operation: op, entry_id: id });
  const start = await Promise.all([
    clock("start", randomUUID()),
    clock("start", randomUUID()),
  ]);
  start.forEach((r) => assert.ok(!r.error));
  assert.equal(
    start[0].data,
    start[1].data,
    "concurrent starts create one shift",
  );
  const shift = start[0].data;
  assert.ok(!(await clock("pause", shift)).error);
  await new Promise((r) => setTimeout(r, 1200));
  assert.ok(!(await clock("resume", shift)).error);
  assert.ok(!(await clock("stop", shift)).error);
  const recorded = (
    await alice.client
      .from("staff_time_entries")
      .select("*")
      .eq("id", shift)
      .single()
  ).data;
  assert.ok(
    recorded.ended_at && recorded.break_seconds >= 1,
    "pause deducted and stop saved",
  );
  assert.equal(
    (await bob.client.from("staff_time_entries").select("*")).data.length,
    0,
    "hours protected by RLS",
  );
  assert.ok(
    (
      await bob.client.rpc("staff_clock", {
        operation: "stop",
        entry_id: shift,
      })
    ).error,
    "cannot stop colleague shift",
  );
  const manualId = randomUUID(),
    day = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
  const manual = {
    entry_id: manualId,
    target_user: alice.id,
    start_time: `${day}T06:00:00Z`,
    end_time: `${day}T14:00:00Z`,
    pause_minutes: 30,
    explanation: "Pruefbuchung",
  };
  assert.ok(
    !(await alice.client.rpc("staff_manual_time", manual)).error,
    "manual time saved",
  );
  assert.ok(
    !(await alice.client.rpc("staff_manual_time", manual)).error,
    "manual retry idempotent",
  );
  assert.ok(
    (
      await alice.client.rpc("staff_manual_time", {
        ...manual,
        entry_id: randomUUID(),
      })
    ).error,
    "overlap rejected",
  );
  assert.ok(
    (
      await bob.client.rpc("staff_manual_time", {
        ...manual,
        entry_id: randomUUID(),
      })
    ).error,
    "cross-user write denied",
  );
  assert.ok(!(await configure(alice.id, 2200)).error);
  assert.equal(
    (
      await alice.client
        .from("staff_time_entries")
        .select("hourly_cents")
        .eq("id", manualId)
        .single()
    ).data.hourly_cents,
    1800,
    "historical rate retained",
  );
  assert.ok(
    (await alice.client.from("staff_time_entries").delete().eq("id", manualId))
      .error,
    "history cannot be deleted by employee",
  );
  const request = (id, start, end, kind = "vacation") =>
    alice.client.rpc("staff_request_absence", {
      request_id: id,
      absence_kind: kind,
      first_day: start,
      last_day: end,
    });
  const a = randomUUID(),
    b = randomUUID();
  assert.ok(!(await request(a, "2029-01-08", "2029-01-09")).error);
  assert.ok(!(await request(b, "2029-01-10", "2029-01-11")).error);
  assert.equal(
    (await bob.client.from("staff_requests").select("*")).data.length,
    0,
    "absence and sickness privacy",
  );
  assert.ok(
    (
      await alice.client.rpc("staff_review_absence", {
        request_id: a,
        decision: "approved",
        charged_days: 2,
        reply: "",
      })
    ).error,
    "self approval denied",
  );
  const approve = (id) =>
    operator.client.rpc("staff_review_absence", {
      request_id: id,
      decision: "approved",
      charged_days: 2,
      reply: "",
    });
  const decisions = await Promise.all([approve(a), approve(b)]);
  assert.equal(
    decisions.filter((r) => !r.error).length,
    1,
    "concurrent approvals cannot overdraw allowance",
  );
  const other = decisions[0].error ? a : b;
  assert.ok(
    !(
      await operator.client.rpc("staff_review_absence", {
        request_id: other,
        decision: "rejected",
        charged_days: 2,
        reply: "Nicht ausreichend Urlaub",
      })
    ).error,
  );
  assert.ok(
    (await configure(alice.id, 2200, 2029, 1)).error,
    "entitlement cannot fall below approved leave",
  );
  const sick = randomUUID();
  assert.ok(!(await request(sick, "2029-02-01", "2029-02-02", "sick")).error);
  assert.ok(
    !(
      await operator.client.rpc("staff_review_absence", {
        request_id: sick,
        decision: "approved",
        charged_days: 0,
        reply: "Gute Besserung",
      })
    ).error,
  );
  const pending = randomUUID();
  assert.ok(!(await request(pending, "2029-03-05", "2029-03-05")).error);
  assert.ok(
    !(await alice.client.rpc("staff_cancel_absence", { request_id: pending }))
      .error,
  );
  assert.ok(
    (await customer.client.from("staff_audit").select("*")).data.length === 0,
    "audit hidden from customers",
  );
  assert.ok(
    (await service.auth.admin.deleteUser(alice.id)).error,
    "staff auth deletion restricted until staff records reviewed",
  );
  const anon = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  assert.ok(
    (await anon.from("staff_members").select("*")).error,
    "anonymous reads denied",
  );
  const year = new Date().getFullYear();
  assert.ok(!(await configure(alice.id, 2200, year, 28)).error);
  assert.ok(!(await configure(bob.id, 1800, year, 25)).error);
  const dates = [`${year}-11-09`, `${year}-11-13`];
  assert.ok(!(await request(randomUUID(), ...dates)).error, "inbox fixture");
  assert.ok(
    !(await request(randomUUID(), `${year}-10-05`, `${year}-10-06`, "sick"))
      .error,
  );
  // Verify deactivation against a still valid JWT, then restore only this fixture.
  await service
    .from("staff_members")
    .update({ active: false })
    .eq("user_id", bob.id);
  assert.ok(
    (
      await bob.client.rpc("staff_clock", {
        operation: "start",
        entry_id: randomUUID(),
      })
    ).error,
    "deactivation immediately blocks writes",
  );
  assert.equal(
    (await bob.client.from("staff_requests").select("*")).data.length,
    0,
  );
  await service
    .from("staff_members")
    .update({ active: true })
    .eq("user_id", bob.id);
  if (process.argv.includes("--keep")) {
    writeFileSync(file, JSON.stringify(records));
    keep = true;
  }
  console.log(
    "PASS: staff roles, RLS, forced password, time concurrency, pauses, overlaps, historical wages, private absences, leave approval races, deactivation, audit and deletion protections.",
  );
} finally {
  if (!keep) await cleanup(records);
}
