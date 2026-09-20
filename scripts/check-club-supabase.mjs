// Explicit integration test. Never included in npm test and never reads .env.local.
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import {
  testEnvironment,
  value,
  TEST_PROJECT_REF,
} from "./club-test-support.mjs";

const { service, client } = testEnvironment();
const tag = randomUUID().slice(0, 8),
  checks = [],
  users = [];
const ids = Object.fromEntries(
  [
    "location",
    "otherLocation",
    "drink",
    "variant",
    "rule",
    "reward",
    "event",
  ].map((k) => [k, randomUUID()]),
);
const check = (name, condition) => {
  assert.ok(condition, name);
  checks.push(name);
  console.log("PASS " + name);
};
const rpc = (c, name, args = {}) => value(c.rpc(name, args));
async function account(role) {
  const email = `club-check-${tag}-${role}@example.invalid`;
  const password = randomBytes(24).toString("base64url") + "!Aa9";
  const created = await value(
    service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: "Test",
        last_name: role,
        account_version: "club-test",
        fictional: true,
      },
    }),
  );
  const person = { id: created.user.id, email, password, client: client() };
  users.push(person);
  await value(person.client.auth.signInWithPassword({ email, password }));
  return person;
}
let passed = false;
try {
  const a = await account("customer-a"),
    b = await account("customer-b");
  const staff = await account("staff"),
    manager = await account("manager"),
    admin = await account("admin");
  await value(
    service
      .from("staff_members")
      .insert(
        [staff, manager].map((p) => ({
          user_id: p.id,
          first_name: "Test",
          last_name: "Team",
          email: p.email,
          hourly_cents: 1500,
          must_change_password: false,
        })),
      ),
  );
  await value(
    service
      .from("portal_admins")
      .insert({
        user_id: admin.id,
        username: "CHECK-" + tag,
        must_change_password: false,
      }),
  );
  await value(
    service
      .from("club_locations")
      .insert(
        [ids.location, ids.otherLocation].map((id, i) => ({
          id,
          name: `FIKTIVER TEST ${tag} ${i}`,
          status: "open",
          confirmed: true,
          address: "Nur Testdaten - kein echtes Cafe",
          latitude: 0,
          longitude: i,
        })),
      ),
  );
  await value(
    service.from("club_staff_roles").insert([
      { user_id: staff.id, location_id: ids.location, role: "employee" },
      { user_id: manager.id, location_id: ids.location, role: "manager" },
    ]),
  );
  const denied = await a.client.rpc("club_admin_snapshot");
  check(
    "Customer cannot access privileged API",
    denied.error?.message.includes("CLUB_FORBIDDEN"),
  );
  check(
    "Privileged tests use a real password-only aal1 session",
    (await value(admin.client.auth.getClaims())).claims.aal === "aal1",
  );
  check(
    "Administrator can load actual management data",
    !!(await rpc(admin.client, "club_admin_snapshot")).metrics,
  );
  check("Password-only roles resolve correctly", (await rpc(admin.client, "club_snapshot")).role === "administrator" && (await rpc(staff.client, "club_snapshot")).role === "employee" && (await rpc(manager.client, "club_snapshot")).role === "manager");
  await value(service.from("portal_admins").update({must_change_password:true}).eq("user_id",admin.id));
  check("Initial password change remains mandatory", !!(await admin.client.rpc("club_admin_snapshot")).error);
  await value(service.from("portal_admins").update({must_change_password:false}).eq("user_id",admin.id));
  await value(service.from("staff_members").update({active:false}).eq("user_id",staff.id));
  check("Inactive staff cannot work", !(await rpc(staff.client,"club_can_work",{location:ids.location})));
  await value(service.from("staff_members").update({active:true}).eq("user_id",staff.id));
  await value(service.from("club_staff_roles").delete().eq("user_id",staff.id));
  const unassigned = await rpc(staff.client,"club_snapshot");
  check("Unassigned staff reaches service without gaining location access", unassigned.role === "employee" && unassigned.work_locations.length === 0 && !(await rpc(staff.client,"club_can_work",{location:ids.location})));
  await value(service.from("club_staff_roles").insert({user_id:staff.id,location_id:ids.location,role:"employee"}));
  await rpc(admin.client, "club_admin_save", {
    entity: "drink",
    payload: {
      id: ids.drink,
      name: "FIKTIVES TESTGETRAENK " + tag,
      description: "Nur Integrationstest",
      active: true,
    },
  });
  await rpc(admin.client, "club_admin_save", {
    entity: "variant",
    payload: {
      id: ids.variant,
      drink_id: ids.drink,
      size: "Test",
      temperature: "Heiss",
      milk: "Keine",
      extras: "",
      active: true,
    },
  });
  await rpc(admin.client, "club_admin_save", {
    entity: "rule",
    payload: {
      id: ids.rule,
      location_id: ids.location,
      title: "FIKTIVE TESTREGEL",
      cents_per_point: 100,
      conditions: "Nur Test, keine wirtschaftliche Freigabe",
      active: true,
    },
  });
  await rpc(admin.client, "club_admin_save", {
    entity: "reward",
    payload: {
      id: ids.reward,
      title: "FIKTIVE TESTPRAEMIE",
      description: "Kein echter Anspruch",
      points: 30,
      conditions: "Nur Integrationstest",
      location_id: ids.location,
      active: true,
    },
  });
  await rpc(admin.client, "club_admin_save", {
    entity: "content",
    payload: {
      id: ids.event,
      kind: "event",
      title: "FIKTIVES TESTEVENT",
      body: "Kein echtes Event. Integrationstest.",
      published: true,
      starts_at: new Date(Date.now() - 60000).toISOString(),
      ends_at: new Date(Date.now() + 3600000).toISOString(),
      capacity: 1,
    },
  });
  const memberA = await rpc(a.client, "club_join");
  await rpc(b.client, "club_join");
  check(
    "Repeated joins preserve membership identity",
    (await rpc(a.client, "club_join")) === memberA,
  );
  const snapshot = await rpc(a.client, "club_snapshot");
  check(
    "New member has zero points and an independent card identifier",
    snapshot.balance === 0 &&
      snapshot.member.card_identifier !== a.id &&
      snapshot.member.id !== snapshot.member.card_identifier,
  );
  const own = await value(a.client.from("club_memberships").select("user_id"));
  check(
    "RLS hides the second customer",
    own.length === 1 && own[0].user_id === a.id,
  );
  check(
    "Anonymous users cannot read cards",
    !!(await client().from("club_memberships").select("id")).error,
  );
  check(
    "Customers cannot assign roles",
    !!(
      await a.client
        .from("club_staff_roles")
        .insert({ user_id: a.id, location_id: ids.location, role: "manager" })
    ).error,
  );
  check(
    "Customers cannot directly modify points",
    !!(
      await a.client
        .from("loyalty_accounts")
        .update({ balance: 9999 })
        .eq("user_id", a.id)
    ).error,
  );
  check(
    "Customers cannot inspect Wallet tokens",
    !!(await a.client.from("club_wallet_passes").select("*")).error,
  );
  const favorite = await rpc(a.client, "club_save_favourite", {
    favourite_id: null,
    selected_variant: ids.variant,
    label: "Mein Testkaffee",
  });
  check(
    "Favourite is persisted and isolated",
    (await rpc(a.client, "club_snapshot")).favourites[0].id === favorite &&
      (await rpc(b.client, "club_snapshot")).favourites.length === 0,
  );
  check(
    "Foreign favourite modification rejected",
    (
      await b.client.rpc("club_save_favourite", {
        favourite_id: favorite,
        selected_variant: ids.variant,
        label: "Fremd",
      })
    ).error?.message.includes("CLUB_NOT_FOUND"),
  );
  await rpc(a.client, "club_save_profile", {
    given_name: "Karten",
    family_name: "Test",
    telephone: "",
    preferred: null,
    order_messages: true,
    marketing: true,
  });
  await rpc(a.client, "club_set_marketing", { subscribed: false });
  const consent = await value(
    a.client
      .from("newsletter_events")
      .select("subscribed,consent_version,created_at")
      .order("created_at"),
  );
  check(
    "Consent history records opt-in, version, time and withdrawal",
    consent.some((c) => c.subscribed && c.created_at && c.consent_version) &&
      consent.at(-1).subscribed === false,
  );
  const card = "LC1:" + snapshot.member.card_identifier;
  const lookup = await rpc(staff.client, "club_lookup", {
    card,
    location: ids.location,
  });
  check(
    "Staff lookup returns minimal customer data",
    lookup.member_number === snapshot.member.member_number &&
      !("email" in lookup) &&
      !("phone" in lookup),
  );
  check(
    "Staff cannot use another location",
    (
      await staff.client.rpc("club_lookup", {
        card,
        location: ids.otherLocation,
      })
    ).error?.message.includes("CLUB_FORBIDDEN"),
  );
  const booking = {
    card,
    location: ids.location,
    operation: "award",
    amount: 5000,
    reference_text: "RECEIPT-" + tag,
    reason_text: "Fiktiver Testbeleg",
    request_id: randomUUID(),
  };
  check(
    "Customer cannot award points using a known card",
    (await a.client.rpc("club_book_points", booking)).error?.message.includes(
      "CLUB_FORBIDDEN",
    ),
  );
  const repeated = await Promise.all([
    rpc(staff.client, "club_book_points", booking),
    rpc(staff.client, "club_book_points", booking),
  ]);
  check(
    "Concurrent identical receipt is awarded only once",
    repeated.every((n) => n === 50) &&
      (await rpc(a.client, "club_snapshot")).entries.length === 1,
  );
  check(
    "Changed retry is rejected",
    (
      await staff.client.rpc("club_book_points", { ...booking, amount: 6000 })
    ).error?.message.includes("CLUB_CONFLICT"),
  );
  const attempts = await Promise.all([
    a.client.rpc("club_reserve_reward", {
      reward: ids.reward,
      request_id: randomUUID(),
    }),
    a.client.rpc("club_reserve_reward", {
      reward: ids.reward,
      request_id: randomUUID(),
    }),
  ]);
  check(
    "Concurrent reservations cannot overspend",
    attempts.filter((r) => !r.error).length === 1 &&
      attempts.some((r) => r.error?.message.includes("CLUB_BALANCE")),
  );
  const redemption = attempts.find((r) => !r.error).data;
  check(
    "Retry returns the same reserved reward",
    (await rpc(a.client, "club_reserve_reward", {
      reward: ids.reward,
      request_id: redemption,
    })) === redemption,
  );
  check(
    "Balance never becomes negative",
    (await rpc(a.client, "club_snapshot")).balance === 20,
  );
  const finish = { redemption, location: ids.location, cancel: false };
  const fulfilled = await Promise.all([
    staff.client.rpc("club_finish_reward", finish),
    staff.client.rpc("club_finish_reward", finish),
  ]);
  check(
    "Concurrent fulfilment consumes a reward once",
    fulfilled.every((r) => !r.error) &&
      (await rpc(a.client, "club_snapshot")).redemptions.filter(
        (r) => r.status === "fulfilled",
      ).length === 1,
  );
  check(
    "Staff cannot make corrections",
    (
      await staff.client.rpc("club_book_points", {
        ...booking,
        operation: "correction",
        amount: 5,
        reference_text: "CORR-" + tag,
        request_id: randomUUID(),
      })
    ).error?.message.includes("CLUB_FORBIDDEN"),
  );
  await rpc(manager.client, "club_book_points", {
    ...booking,
    operation: "correction",
    amount: -5,
    reference_text: "CORR-" + tag,
    reason_text: "Begruendete Testkorrektur",
    request_id: randomUUID(),
  });
  check(
    "Manager correction is reflected in the ledger",
    (await rpc(a.client, "club_snapshot")).balance === 15,
  );
  const signups = await Promise.all([
    a.client.rpc("club_event_signup", { event: ids.event, joining: true }),
    b.client.rpc("club_event_signup", { event: ids.event, joining: true }),
  ]);
  check(
    "Simultaneous event registrations respect capacity",
    signups.filter((r) => !r.error).length === 1 &&
      signups.some((r) => r.error?.message.includes("CLUB_CAPACITY")),
  );
  const exported = await rpc(a.client, "club_export");
  check(
    "Account export contains no second customer identity",
    !JSON.stringify(exported).includes(b.id) &&
      !JSON.stringify(exported).includes(b.email),
  );
  check(
    "Deletion request is idempotent",
    (await rpc(a.client, "club_request_deletion")) ===
      (await rpc(a.client, "club_request_deletion")),
  );
  await rpc(admin.client, "club_admin_save", {
    entity: "member",
    payload: { id: memberA, status: "suspended" },
  });
  check(
    "Suspended card cannot receive points",
    (
      await staff.client.rpc("club_book_points", {
        ...booking,
        request_id: randomUUID(),
        reference_text: "SUSPEND-" + tag,
      })
    ).error?.message.includes("CLUB_NOT_FOUND"),
  );
  await rpc(a.client, "club_set_marketing", { subscribed: false });
  check(
    "Suspended members can still withdraw marketing",
    (await rpc(a.client, "club_snapshot")).newsletter === false,
  );
  await value(a.client.auth.signOut({ scope: "local" }));
  check(
    "Signed-out client loses access",
    !!(await a.client.rpc("club_snapshot")).error,
  );
  // Provider-generated links exercise confirmation/recovery without sending any email.
  const signupEmail = `club-check-${tag}-confirmation@example.invalid`,
    password = randomBytes(24).toString("base64url") + "!Aa9";
  const signup = await value(
    service.auth.admin.generateLink({
      type: "signup",
      email: signupEmail,
      password,
      options: { data: { first_name: "Test", last_name: "Bestaetigung" } },
    }),
  );
  const newcomer = { id: signup.user.id, client: client() };
  users.push(newcomer);
  check(
    "Unconfirmed account cannot sign in",
    !!(
      await newcomer.client.auth.signInWithPassword({
        email: signupEmail,
        password,
      })
    ).error,
  );
  await value(
    newcomer.client.auth.verifyOtp({
      type: "signup",
      token_hash: signup.properties.hashed_token,
    }),
  );
  check(
    "Provider confirmation enables a real membership",
    !!(await rpc(newcomer.client, "club_join")),
  );
  check(
    "Confirmation link cannot be reused",
    !!(
      await client().auth.verifyOtp({
        type: "signup",
        token_hash: signup.properties.hashed_token,
      })
    ).error,
  );
  const recovery = await value(
    service.auth.admin.generateLink({ type: "recovery", email: signupEmail }),
  );
  const recovered = client();
  await value(
    recovered.auth.verifyOtp({
      type: "recovery",
      token_hash: recovery.properties.hashed_token,
    }),
  );
  const replacement = randomBytes(24).toString("base64url") + "!Aa9";
  await value(recovered.auth.updateUser({ password: replacement }));
  await value(recovered.auth.signOut({ scope: "local" }));
  check(
    "Recovery changes password through Supabase",
    !!(await client().auth.signInWithPassword({ email: signupEmail, password }))
      .error &&
      !(
        await client().auth.signInWithPassword({
          email: signupEmail,
          password: replacement,
        })
      ).error,
  );
  passed = true;
} finally {
  // Delete only fixtures from this run, using captured IDs. No global reset/seed.
  const userIds = users.map((u) => u.id);
  if (userIds.length) {
    await value(service.from("club_audit").delete().in("actor_id", userIds));
    await value(
      service
        .from("club_audit")
        .delete()
        .in("location_id", [ids.location, ids.otherLocation]),
    );
    await value(
      service.from("club_redemptions").delete().in("user_id", userIds),
    );
    await value(
      service.from("club_memberships").delete().in("user_id", userIds),
    );
    await value(
      service.from("club_deletion_requests").delete().in("user_id", userIds),
    );
    await value(service.from("staff_members").delete().in("user_id", userIds));
    for (const person of users)
      await value(service.auth.admin.deleteUser(person.id));
  }
  for (const [table, key] of [
    ["club_content", "event"],
    ["club_rewards", "reward"],
    ["club_rules", "rule"],
    ["club_drink_variants", "variant"],
    ["club_drinks", "drink"],
  ])
    await value(service.from(table).delete().eq("id", ids[key]));
  await value(
    service
      .from("club_locations")
      .delete()
      .in("id", [ids.location, ids.otherLocation]),
  );
  await mkdir("artifacts/club-staging", { recursive: true });
  await writeFile(
    "artifacts/club-staging/supabase-results.json",
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        project: TEST_PROJECT_REF,
        passed,
        checks,
        fixturesRemoved: true,
        mailDeliveryTested: false,
      },
      null,
      2,
    ),
  );
}
