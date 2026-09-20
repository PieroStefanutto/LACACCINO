import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile, mkdir } from "node:fs/promises";

// This checker never loads .env files or talks to Supabase.
const origin = "http://127.0.0.1:3120";
const response = await fetch(origin + "/club/anmelden");
assert.match(
  await response.text(),
  /Lokale Demo mit fiktiven Testpersonen/,
  "Requires isolated demo server",
);
let checks = 0;
async function api(
  cookie,
  operation,
  values,
  expected = 200,
  customOrigin = origin,
) {
  const r = await fetch(origin + "/api/club/" + operation, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: customOrigin,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(values),
  });
  assert.equal(r.status, expected, operation + ": " + (await r.clone().text()));
  checks++;
  return r;
}
async function login(persona) {
  const r = await api(null, "demo-login", { persona });
  return r.headers.get("set-cookie").split(";")[0];
}
async function data(cookie) {
  const r = await fetch(origin + "/api/club/export", { headers: { cookie } });
  assert.equal(r.status, 200);
  assert.match(r.headers.get("cache-control"), /no-store/);
  checks++;
  return r.json();
}
const c = await login("mila"),
  c2 = await login("jonas"),
  staff = await login("team"),
  manager = await login("leitung"),
  admin = await login("admin");
await api(c, "profile", {}, 403, "https://untrusted.invalid");
await api(null, "reserve", {}, 401);
await api(c, "admin", { entity: "member" }, 400);
const before = await data(c),
  base = before.club.balance;
const request_id = randomUUID(),
  reference = "LOCAL-HTTP-" + randomUUID();
const location_id = "20000000-0000-4000-8000-000000000001";
const card = before.club.member.member_number;
const qr = "LC1:" + before.club.member.card_identifier;
const lookup = await (
  await api(staff, "lookup", { card: qr, location_id })
).json();
assert.equal(lookup.result.member_number, card);
assert.equal(lookup.result.email, undefined);
const booking = {
  card,
  location_id,
  kind: "award",
  amount: "5000",
  reference,
  reason: "Fiktiver HTTP-Testbeleg",
  request_id,
};
await api(c, "book", booking, 400);
await api(
  staff,
  "book",
  { ...booking, location_id: "20000000-0000-4000-8000-000000000002" },
  400,
);
await api(staff, "book", booking);
await api(staff, "book", booking);
await api(staff, "book", { ...booking, amount: "1000" }, 400);
assert.equal((await data(c)).club.balance, base + 50);
const reserved = randomUUID();
await api(c, "reserve", {
  reward_id: "70000000-0000-4000-8000-000000000001",
  request_id: reserved,
});
await api(c, "reserve", {
  reward_id: "70000000-0000-4000-8000-000000000001",
  request_id: reserved,
});
await api(c2, "finish-reward", { id: reserved, cancel: true }, 400);
await api(staff, "finish-reward", { id: reserved, location_id });
await api(staff, "finish-reward", { id: reserved, location_id });
await api(c, "finish-reward", { id: reserved, cancel: true }, 400);
const returned = randomUUID();
await api(c, "reserve", {
  reward_id: "70000000-0000-4000-8000-000000000001",
  request_id: returned,
});
await api(c, "finish-reward", { id: returned, cancel: true });
await api(c, "finish-reward", { id: returned, cancel: true });
assert.equal((await data(c)).club.balance, base + 30);
await api(
  staff,
  "book",
  {
    ...booking,
    kind: "correction",
    amount: "-1",
    request_id: randomUUID(),
    reference: randomUUID(),
  },
  400,
);
await api(manager, "book", {
  ...booking,
  kind: "correction",
  amount: "-30",
  request_id: randomUUID(),
  reference: randomUUID(),
  reason: "Fiktive Testbereinigung",
});
assert.equal((await data(c)).club.balance, base);
const favourite = await (
  await api(c, "favourite", {
    variant_id: "60000000-0000-4000-8000-000000000001",
    nickname: "HTTP " + randomUUID().slice(0, 8),
  })
).json();
await api(
  c2,
  "favourite",
  {
    id: favourite.result,
    variant_id: "60000000-0000-4000-8000-000000000001",
    nickname: "Fremdes Konto",
  },
  400,
);
await api(c, "remove-favourite", { id: favourite.result });
const event = "80000000-0000-4000-8000-000000000002";
await api(c, "event", { id: event, joining: false });
await api(c2, "event", { id: event, joining: false });
await api(c, "event", { id: event, joining: true });
await api(c2, "event", { id: event, joining: true }, 400);
await api(c, "event", { id: event, joining: false });
const drink = await (
  await api(admin, "admin", {
    entity: "drink",
    name: "Fiktiver HTTP-Testdrink",
    description: "Test der Administration",
    active: true,
  })
).json();
await api(admin, "admin", {
  entity: "drink",
  id: drink.result,
  name: "Fiktiver HTTP-Testdrink",
  active: false,
});
await api(admin, "admin", {
  entity: "member",
  id: before.club.member.id,
  status: "suspended",
});
await api(
  staff,
  "book",
  { ...booking, request_id: randomUUID(), reference: randomUUID() },
  400,
);
await api(admin, "admin", {
  entity: "member",
  id: before.club.member.id,
  status: "active",
});
for (const path of [
  "/club",
  "/club/karte",
  "/club/vorteile",
  "/club/profil",
  "/club/getraenke",
  "/club/standorte",
  "/club/neuigkeiten",
  "/club/nachrichten",
  "/club/zukunft",
]) {
  const r = await fetch(origin + path, { headers: { cookie: c } });
  assert.equal(r.status, 200, path);
  assert.ok(!(await r.text()).includes("Dafür fehlen die"));
  checks++;
}
await api(c, "logout", {});
const result = {
  checkedAt: new Date().toISOString(),
  origin,
  checks,
  passed: true,
  scope:
    "Isolated local demo, same SQL RPCs; not a Supabase Auth or production test",
};
await mkdir("artifacts", { recursive: true });
await writeFile(
  "artifacts/club-http-results.json",
  JSON.stringify(result, null, 2),
);
console.log(result);
