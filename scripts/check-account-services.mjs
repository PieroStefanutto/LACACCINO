import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
const base = process.env.CHECK_URL || "http://localhost:3105";
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const db = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  options,
);
const fixtureFile = "artifacts/account-services-fixtures.json";
const users = [],
  orderIds = [];
async function cleanup(records, orders) {
  // Coupons may refer to retained orders; delete accounts first.
  for (const u of records) {
    const { error } = await db.auth.admin.deleteUser(u.id);
    assert.ok(
      !error || error.code === "user_not_found",
      "test account cleanup",
    );
  }
  if (orders.length)
    assert.ok(!(await db.from("shop_orders").delete().in("id", orders)).error);
}
if (process.argv.includes("--cleanup")) {
  if (existsSync(fixtureFile)) {
    const saved = JSON.parse(readFileSync(fixtureFile, "utf8"));
    await cleanup(saved.users, saved.orderIds);
    unlinkSync(fixtureFile);
  }
  console.log("Account-service fixtures removed.");
  process.exit(0);
}
async function makeUser(label, confirmed = true) {
  const email = `account-service-${randomUUID()}@example.com`,
    password = randomBytes(24).toString("base64url") + "!Aa3";
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: confirmed,
    user_metadata: {
      first_name: "Lea",
      last_name: "Beispiel",
      newsletter: true,
      newsletter_version: "newsletter-2026-09-18",
    },
  });
  assert.ok(!error, "create isolated test user");
  const user = { id: data.user.id, email, password, label };
  users.push(user);
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    options,
  );
  if (confirmed)
    assert.ok(
      !(await client.auth.signInWithPassword({ email, password })).error,
    );
  return { ...user, client };
}
async function order(user, status, items) {
  const { data, error } = await db
    .from("shop_orders")
    .insert({
      user_id: user.id,
      order_number: `TEST-${randomUUID()}`,
      status,
      total_cents: 6000,
    })
    .select("id")
    .single();
  assert.ok(!error);
  orderIds.push(data.id);
  if (items.length)
    assert.ok(
      !(
        await db
          .from("shop_order_items")
          .insert(items.map((i) => ({ ...i, order_id: data.id })))
      ).error,
    );
  return data.id;
}
const decode = (s) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
function fields(html, marker) {
  const form = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)]
    .map((m) => m[0])
    .find((s) => s.includes(marker));
  assert.ok(form, `form ${marker}`);
  const data = new FormData();
  for (const m of form.matchAll(/<input\b[^>]*>/g)) {
    if (!m[0].includes('type="hidden"')) continue;
    const name = m[0].match(/name="([^"]+)"/)?.[1];
    if (name)
      data.append(
        decode(name),
        decode(m[0].match(/value="([^"]*)"/)?.[1] || ""),
      );
  }
  return data;
}
function httpClient() {
  const jar = new Map();
  return async (path, data, foreign = false) => {
    const response = await fetch(new URL(path, base), {
      redirect: "manual",
      method: data ? "POST" : "GET",
      headers: {
        cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; "),
        ...(data
          ? { origin: foreign ? "https://untrusted.example" : base }
          : {}),
      },
      ...(data ? { body: data } : {}),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const part = cookie.split(";")[0],
        i = part.indexOf("=");
      jar.set(part.slice(0, i), part.slice(i + 1));
    }
    return { response, html: await response.text() };
  };
}
async function login(request, user) {
  const page = await request("/konto");
  const data = fields(page.html, 'id="auth-email"');
  data.set("email", user.email);
  data.set("password", user.password);
  data.set("mode", "login");
  assert.equal((await request("/konto", data)).response.status, 303);
}
let keep = false;
try {
  const alice = await makeUser("delete-test"),
    bob = await makeUser("browser"),
    pending = await makeUser("unconfirmed", false);
  const aliceHttp = httpClient(),
    bobHttp = httpClient(),
    anon = httpClient();
  const getCoupons = (user) =>
    db
      .from("customer_coupons")
      .select("*")
      .eq("user_id", user.id)
      .order("offer_slot");
  const coupons = (await getCoupons(alice)).data;
  assert.deepEqual(
    coupons.map((c) => [c.discount_percent, c.minimum_cents]),
    [
      [10, 5000],
      [10, 5000],
      [10, 5000],
      [15, 15000],
      [20, 50000],
    ],
  );
  assert.equal(
    (await getCoupons(pending)).data.length,
    0,
    "no coupons before email confirmation",
  );
  await db.rpc("portal_issue_coupons", { customer_id: alice.id });
  assert.equal((await getCoupons(alice)).data.length, 5, "issuance idempotent");
  assert.equal(
    (
      await bob.client
        .from("customer_coupons")
        .select("*")
        .eq("user_id", alice.id)
    ).data.length,
    0,
  );
  assert.ok(
    (
      await alice.client
        .from("customer_coupons")
        .update({ discount_percent: 99 })
        .eq("id", coupons[0].id)
    ).error,
  );
  assert.ok(
    (
      await bob.client.rpc("portal_activate_coupon", {
        coupon_id: coupons[0].id,
      })
    ).error,
  );
  assert.ok(
    (await alice.client.rpc("portal_issue_coupons", { customer_id: alice.id }))
      .error,
  );
  const item = {
    product_key: "test-coffee",
    product_name: "Testartikel Kaffee",
    variant_name: "Testvariante",
    quantity: 2,
    unit_price_cents: 1500,
  };
  const paidOrder = await order(alice, "paid", [item]);
  await order(alice, "completed", [{ ...item, quantity: 1 }]);
  await order(alice, "cancelled", [
    {
      ...item,
      product_key: "cancelled",
      product_name: "Stornierter Testartikel",
    },
  ]);
  await order(alice, "refunded", [{ ...item, product_key: "refunded" }]);
  await order(bob, "completed", [
    { ...item, product_key: "other", product_name: "Anderer Testartikel" },
  ]);
  assert.equal(
    (await bob.client.from("shop_orders").select("*").eq("user_id", alice.id))
      .data.length,
    0,
  );
  assert.equal(
    (
      await bob.client
        .from("shop_order_items")
        .select("*")
        .eq("order_id", paidOrder)
    ).data.length,
    0,
  );
  assert.ok(
    (
      await alice.client
        .from("shop_orders")
        .insert({
          user_id: alice.id,
          order_number: "FAKE",
          status: "paid",
          total_cents: 1,
        })
    ).error,
  );
  const favourites = await alice.client.rpc("portal_favourite_products", {
    page_offset: 0,
  });
  assert.ok(!favourites.error);
  assert.equal(favourites.data.length, 1);
  assert.equal(Number(favourites.data[0].quantity), 3);
  await login(aliceHttp, alice);
  await login(bobHttp, bob);
  for (const path of [
    "/konto/bestellungen",
    "/konto/lieblingsprodukte",
    "/konto/rabattcodes",
    "/konto/loeschen",
  ]) {
    assert.equal((await anon(path)).response.status, 307);
    const page = await aliceHttp(path);
    assert.equal(page.response.status, 200);
    assert.ok(page.response.headers.get("cache-control").includes("no-store"));
  }
  const history = (await aliceHttp("/konto/bestellungen")).html;
  assert.ok(
    history.includes("Testartikel Kaffee") &&
      !history.includes("Anderer Testartikel"),
  );
  const favouritesPage = (
    await aliceHttp("/konto/lieblingsprodukte")
  ).html.replace(/<!--.*?-->/g, "");
  assert.ok(
    favouritesPage.includes("3 Stück bisher bestellt") &&
      !favouritesPage.includes("Stornierter Testartikel"),
  );
  const couponPage = await aliceHttp("/konto/rabattcodes");
  const activation = fields(couponPage.html, coupons[0].id);
  await bobHttp("/konto/rabattcodes", activation);
  assert.equal(
    (await getCoupons(alice)).data[0].activated_at,
    null,
    "stolen action cannot activate another account's coupon",
  );
  await aliceHttp("/konto/rabattcodes", activation);
  const activatedAt = (await getCoupons(alice)).data[0].activated_at;
  assert.ok(activatedAt);
  await aliceHttp("/konto/rabattcodes", activation);
  assert.equal((await getCoupons(alice)).data[0].activated_at, activatedAt);
  for (const [index, threshold, discount] of [
    [0, 5000, 500],
    [3, 15000, 2250],
    [4, 50000, 10000],
  ]) {
    await alice.client.rpc("portal_activate_coupon", {
      coupon_id: coupons[index].id,
    });
    const args = {
      customer_id: alice.id,
      coupon_code: coupons[index].code,
      goods_subtotal_cents: threshold,
    };
    assert.ok(
      (await alice.client.rpc("portal_coupon_quote", args)).error,
      "quote is server-only",
    );
    assert.equal((await db.rpc("portal_coupon_quote", args)).data, discount);
    assert.ok(
      (
        await db.rpc("portal_coupon_quote", {
          ...args,
          goods_subtotal_cents: threshold - 1,
        })
      ).error,
    );
    assert.ok(
      (await db.rpc("portal_coupon_quote", { ...args, customer_id: bob.id }))
        .error,
    );
  }
  await db
    .from("customer_coupons")
    .update({
      redeemed_at: new Date().toISOString(),
      redeemed_order_id: paidOrder,
    })
    .eq("id", coupons[0].id);
  assert.ok(
    (
      await alice.client.rpc("portal_activate_coupon", {
        coupon_id: coupons[0].id,
      })
    ).error,
  );
  assert.ok(
    (
      await db.rpc("portal_coupon_quote", {
        customer_id: alice.id,
        coupon_code: coupons[0].code,
        goods_subtotal_cents: 5000,
      })
    ).error,
  );
  const deletionPage = await aliceHttp("/konto/loeschen");
  const deletion = fields(deletionPage.html, 'id="delete-confirmation"');
  deletion.set("confirmation", "wrong");
  deletion.set("understood", "yes");
  await aliceHttp("/konto/loeschen", deletion);
  assert.ok(
    (await db.auth.admin.getUserById(alice.id)).data.user,
    "explicit confirmation required",
  );
  deletion.set("confirmation", "LÖSCHEN");
  await anon("/konto/loeschen", deletion);
  assert.ok((await db.auth.admin.getUserById(alice.id)).data.user);
  const foreign = await aliceHttp("/konto/loeschen", deletion, true);
  assert.ok(foreign.response.status >= 400);
  assert.ok((await db.auth.admin.getUserById(alice.id)).data.user);
  await db
    .from("portal_admins")
    .insert({
      user_id: bob.id,
      username: `TEST-${randomUUID()}`,
      must_change_password: false,
    });
  await bobHttp("/konto/loeschen", deletion);
  assert.ok(
    (await db.auth.admin.getUserById(bob.id)).data.user,
    "admin self-deletion blocked",
  );
  await db.from("portal_admins").delete().eq("user_id", bob.id);
  deletion.set("user_id", bob.id); // Ignored: only the authenticated account is deleted.
  const deleted = await aliceHttp("/konto/loeschen", deletion);
  assert.equal(deleted.response.status, 303);
  assert.equal(deleted.response.headers.get("location"), "/konto?deleted=1");
  assert.ok(!(await db.auth.admin.getUserById(alice.id)).data.user);
  assert.ok(
    (await db.auth.admin.getUserById(bob.id)).data.user,
    "cannot choose another deletion target",
  );
  for (const [table, key] of [
    ["profiles", "id"],
    ["loyalty_accounts", "user_id"],
    ["loyalty_entries", "user_id"],
    ["newsletter_preferences", "user_id"],
    ["newsletter_events", "user_id"],
    ["customer_coupons", "user_id"],
    ["waitlist_entries", "user_id"],
  ])
    assert.equal(
      (await db.from(table).select("*").eq(key, alice.id)).data.length,
      0,
      `${table} removed`,
    );
  assert.equal(
    (
      await db
        .from("shop_orders")
        .select("user_id")
        .eq("id", paidOrder)
        .single()
    ).data.user_id,
    null,
    "retained order detached",
  );
  assert.equal(
    (await alice.client.from("shop_orders").select("*")).data?.length || 0,
    0,
    "old token cannot access retained orders",
  );
  assert.ok(
    (await aliceHttp("/konto?deleted=1")).html.includes(
      "Dein Kundenkonto wurde gelöscht",
    ),
  );
  assert.equal((await aliceHttp("/konto/rabattcodes")).response.status, 307);
  users.splice(
    users.findIndex((u) => u.id === alice.id),
    1,
  );
  console.log(
    "PASS: coupon allocation, ownership, activation/retries, thresholds, server-only quotes, redeemed-code rejection, order/favourite isolation, deletion confirmation, admin/origin protection, cascades and retained-order separation.",
  );
  if (process.env.PORTAL_KEEP_FIXTURES === "true") {
    writeFileSync(fixtureFile, JSON.stringify({ users, orderIds }));
    keep = true;
    console.log("Disposable fixtures retained for browser checks.");
  }
} finally {
  if (!keep) await cleanup(users, orderIds);
}
