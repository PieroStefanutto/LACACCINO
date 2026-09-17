import assert from "node:assert/strict";
import test from "node:test";
import { callbackDestination, field, validEmail, validPassword, validateContact } from "../lib/community/validation.ts";

function contact(overrides = {}) {
  const form = new FormData();
  for (const [name, value] of Object.entries({ name: " Test Person ", email: " TEST@example.com ", message: "Eine Frage zur Marke.", consent: "yes", ...overrides })) form.set(name, value);
  return form;
}

test("contact normalizes input and requires consent", () => {
  assert.deepEqual(validateContact(contact()), { name: "Test Person", email: "test@example.com", message: "Eine Frage zur Marke." });
  assert.ok(validateContact(contact({ consent: "" })).error);
  assert.ok(validateContact(contact({ name: "a" })).error);
  assert.ok(validateContact(contact({ message: "x".repeat(4001) })).error);
  assert.ok(validateContact(contact({ email: "someone@example.com\r\nBcc: other@example.com" })).error);
});

test("form fields reject files and bound email and password input", () => {
  const form = contact();
  form.set("name", new Blob(["fake name"]), "name.txt");
  assert.equal(field(form, "name"), "");
  assert.equal(validEmail("a@b.example"), true);
  assert.equal(validEmail("a".repeat(250) + "@b.example"), false);
  assert.equal(validPassword("short"), false);
  assert.equal(validPassword("twelve-chars!"), true);
  assert.equal(validPassword("a".repeat(129)), false);
});

test("auth callback only allows known account destinations", () => {
  for (const value of [null, "https://attacker.example", "//attacker.example", "/\\attacker.example", "/konto/passwort?next=https://attacker.example"]) assert.equal(callbackDestination(value), "/konto");
  assert.equal(callbackDestination("/konto/passwort"), "/konto/passwort");
});
