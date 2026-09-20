import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, verify } from "node:crypto";
import forge from "node-forge";
import {
  signGoogleSaveJwt,
  syncGoogleObject,
  signAppleStoreCard,
} from "../lib/club/wallet-signing.ts";
import { appleStoreCard, googleLoyaltyObject } from "../lib/club/wallet.ts";
const member = {
  id: "30000000-0000-4000-8000-000000000001",
  cardIdentifier: "40000000-0000-4000-8000-000000000001",
  number: "LC-TEST",
  name: "Test Person",
  balance: 17,
  status: "active",
};
const google = googleLoyaltyObject(member, {
  issuerId: "123456",
  classId: "123456.club",
});
test("Google JWT is signed with RSA; object ID and identification-only QR are stable", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  });
  const jwt = signGoogleSaveJwt(
    google,
    {
      email: "test@example.iam.gserviceaccount.com",
      privateKey: privateKey.export({ type: "pkcs8", format: "pem" }),
      origins: ["https://example.invalid"],
    },
    1000,
  );
  const [head, payload, signature] = jwt.split(".");
  assert.ok(
    verify(
      "RSA-SHA256",
      Buffer.from(head + "." + payload),
      publicKey,
      Buffer.from(signature, "base64url"),
    ),
  );
  const body = JSON.parse(Buffer.from(payload, "base64url"));
  assert.equal(body.aud, "google");
  assert.equal(body.typ, "savetowallet");
  assert.equal(body.payload.loyaltyObjects[0].loyaltyPoints.balance.int, 17);
  assert.equal(
    body.payload.loyaltyObjects[0].barcode.value,
    "LC1:" + member.cardIdentifier,
  );
});
test("Google create/update retry uses one stable object; inactive update omits barcode", async () => {
  const calls = [],
    statuses = [404, 409, 200];
  await syncGoogleObject(google, "fake-test-token", async (url, options) => {
    calls.push({ url, options });
    return new Response("{}", { status: statuses.shift() });
  });
  assert.deepEqual(
    calls.map((c) => c.options.method),
    ["PUT", "POST", "PUT"],
  );
  assert.equal(calls[0].url, calls[2].url);
  const closed = googleLoyaltyObject(
    { ...member, status: "closed" },
    { issuerId: "123456", classId: "123456.club" },
  );
  await syncGoogleObject(closed, "fake-test-token", async (_url, options) => {
    assert.equal(options.method, "PUT");
    assert.equal(JSON.parse(options.body).barcode, undefined);
    assert.equal(JSON.parse(options.body).state, "INACTIVE");
    return new Response("{}");
  });
  await assert.rejects(
    syncGoogleObject(
      google,
      "fake-test-token",
      async () => new Response("{}", { status: 401 }),
    ),
    /synchronization failed/,
  );
});
test("Apple signing fails closed without required assets and certificates", () => {
  const payload = appleStoreCard(member, {
    passTypeIdentifier: "pass.example.test",
    teamIdentifier: "TESTTEAM",
    webServiceURL: "https://example.invalid/wallet",
    authenticationToken: "test-token-1234567890123456789012345",
  });
  assert.throws(
    () =>
      signAppleStoreCard(
        payload,
        {},
        {
          signerCert: Buffer.alloc(0),
          signerKey: Buffer.alloc(0),
          wwdr: Buffer.alloc(0),
        },
      ),
    /assets missing/,
  );
});
test("Apple package is signed with an ephemeral fictional CA; this is not an Apple device test", () => {
  const keys = () => {
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    return {
      publicKey: forge.pki.publicKeyFromPem(
        pair.publicKey.export({ type: "spki", format: "pem" }),
      ),
      privateKey: forge.pki.privateKeyFromPem(
        pair.privateKey.export({ type: "pkcs1", format: "pem" }),
      ),
    };
  };
  const authorityKeys = keys(),
    leafKeys = keys();
  const authority = forge.pki.createCertificate();
  authority.publicKey = authorityKeys.publicKey;
  authority.serialNumber = "01";
  authority.validity.notBefore = new Date(Date.now() - 86400000);
  authority.validity.notAfter = new Date(Date.now() + 86400000);
  authority.setSubject([
    { name: "commonName", value: "Fictional local test CA" },
  ]);
  authority.setIssuer(authority.subject.attributes);
  authority.setExtensions([{ name: "basicConstraints", cA: true }]);
  authority.sign(authorityKeys.privateKey, forge.md.sha256.create());
  const leaf = forge.pki.createCertificate();
  leaf.publicKey = leafKeys.publicKey;
  leaf.serialNumber = "02";
  leaf.validity.notBefore = authority.validity.notBefore;
  leaf.validity.notAfter = authority.validity.notAfter;
  leaf.setSubject([
    { name: "commonName", value: "pass.example.test" },
    { name: "organizationalUnitName", value: "TESTTEAM" },
  ]);
  leaf.setIssuer(authority.subject.attributes);
  leaf.sign(authorityKeys.privateKey, forge.md.sha256.create());
  const payload = appleStoreCard(member, {
    passTypeIdentifier: "pass.example.test",
    teamIdentifier: "TESTTEAM",
    webServiceURL: "https://example.invalid/wallet",
    authenticationToken: "test-token-1234567890123456789012345",
  });
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aRZkAAAAASUVORK5CYII=",
    "base64",
  );
  const certificates = {
    signerCert: Buffer.from(forge.pki.certificateToPem(leaf)),
    signerKey: Buffer.from(forge.pki.privateKeyToPem(leafKeys.privateKey)),
    wwdr: Buffer.from(forge.pki.certificateToPem(authority)),
  };
  const pass = signAppleStoreCard(
    payload,
    { "icon.png": png, "icon@2x.png": png },
    certificates,
  );
  assert.equal(pass.subarray(0, 2).toString(), "PK");
  assert.ok(pass.includes(Buffer.from("manifest.json")));
  assert.ok(pass.includes(Buffer.from("signature")));
  assert.throws(
    () =>
      signAppleStoreCard(
        { ...payload, teamIdentifier: "WRONGTEAM" },
        { "icon.png": png, "icon@2x.png": png },
        certificates,
      ),
    /identity mismatch/,
  );
});
