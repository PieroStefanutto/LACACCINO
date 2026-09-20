import test from "node:test";
import assert from "node:assert/strict";
import {
  cardPayload,
  appleStoreCard,
  googleLoyaltyObject,
  walletReadiness,
} from "../lib/club/wallet.ts";
import { clubMode, safeClubDestination } from "../lib/club/config.ts";
const member = {
  id: "30000000-0000-4000-8000-000000000001",
  cardIdentifier: "40000000-0000-4000-8000-000000000001",
  number: "LC-DEMO",
  name: "Mila Beispiel",
  balance: 40,
  status: "active",
};
const apple = {
  passTypeIdentifier: "pass.example.test",
  teamIdentifier: "EXAMPLE",
  webServiceURL: "https://example.invalid/wallet/apple",
  authenticationToken: "fictional-test-token-only-123456789012345",
};
test("Wallet payloads contain the same membership and balance; QR contains only an independent ID", () => {
  const a = appleStoreCard(member, apple),
    g = googleLoyaltyObject(member, {
      issuerId: "12345",
      classId: "12345.club",
    });
  assert.equal(a.storeCard.primaryFields[0].value, 40);
  assert.equal(g.loyaltyPoints.balance.int, 40);
  assert.equal(a.barcodes[0].message, g.barcode.value);
  assert.equal(a.barcodes[0].message, cardPayload(member.cardIdentifier));
  for (const sensitive of [
    member.name,
    member.number,
    member.id,
    apple.authenticationToken,
    "@",
  ])
    assert.ok(!g.barcode.value.includes(sensitive));
  assert.equal(
    appleStoreCard({ ...member, balance: 80 }, apple).serialNumber,
    a.serialNumber,
  );
  assert.equal(
    googleLoyaltyObject(
      { ...member, balance: 80 },
      { issuerId: "12345", classId: "12345.club" },
    ).id,
    g.id,
  );
});
test("Inactive and closed Wallet payloads carry no usable QR; closed name is removed", () => {
  const a = appleStoreCard({ ...member, status: "closed" }, apple);
  const g = googleLoyaltyObject(
    { ...member, status: "suspended" },
    { issuerId: "12345", classId: "12345.club" },
  );
  assert.equal(a.voided, true);
  assert.equal(a.barcodes, undefined);
  assert.equal(g.state, "INACTIVE");
  assert.equal(g.barcode, undefined);
  assert.ok(!JSON.stringify(a).includes(member.name));
  assert.throws(() => cardPayload("mila@example.invalid"));
  assert.throws(() =>
    appleStoreCard(member, {
      ...apple,
      webServiceURL: "http://example.invalid",
    }),
  );
  assert.ok(walletReadiness().every((p) => !p.ready));
});
test("Demo cannot activate in production; linked real Supabase project is excluded from Club preview", () => {
  const env = { CLUB_MODE: "demo", APP_ENV: "local", NODE_ENV: "development" };
  assert.equal(clubMode(env), "demo");
  assert.equal(clubMode({ ...env, NODE_ENV: "production" }), "off");
  assert.equal(clubMode({ ...env, VERCEL: "1" }), "off");
  const preview = {
    CLUB_MODE: "supabase",
    APP_ENV: "preview",
    SUPABASE_URL: "https://fictional-test.supabase.co",
    CLUB_SUPABASE_PROJECT_REF: "fictional-test",
  };
  assert.equal(clubMode(preview), "supabase");
  assert.equal(clubMode({ ...preview, VERCEL_ENV: "production" }), "off");
  assert.equal(clubMode({ ...preview, APP_ENV: "production" }), "off");
  assert.equal(
    clubMode({
      CLUB_MODE: "supabase",
      APP_ENV: "preview",
      SUPABASE_URL: "https://midxwtzhytzvbmidpvsl.supabase.co",
      CLUB_SUPABASE_PROJECT_REF: "midxwtzhytzvbmidpvsl",
    }),
    "off",
  );
  for (const url of [
    "https://evil.invalid",
    "//evil.invalid",
    "/club/../admin",
    "/club?next=https://evil.invalid",
  ])
    assert.equal(safeClubDestination(url), "/club");
  assert.equal(safeClubDestination("/club/karte"), "/club/karte");
});
