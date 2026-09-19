import assert from "node:assert/strict";
import test from "node:test";
import {
  netSeconds,
  totals,
  leaveBalance,
  berlinInstant,
  decimalInput,
  validDay,
} from "../lib/staff/model.ts";
const entry = {
  id: "a",
  user_id: "u",
  started_at: "2026-09-18T06:00:00Z",
  ended_at: "2026-09-18T14:00:00Z",
  break_seconds: 1800,
  break_started_at: null,
  hourly_cents: 1500,
  source: "manual",
  voided: false,
  note: "",
};
test("earnings subtract unpaid pauses and preserve each historical hourly rate", () => {
  assert.equal(netSeconds(entry, 0), 27000);
  assert.deepEqual(
    totals([entry, { ...entry, id: "b", hourly_cents: 2000 }], 0),
    { seconds: 54000, cents: 26250 },
  );
  assert.equal(netSeconds({ ...entry, voided: true }, 0), 0);
});
test("live earnings stop increasing during an open break", () => {
  const paused = {
    ...entry,
    ended_at: null,
    break_started_at: "2026-09-18T12:00:00Z",
  };
  assert.equal(netSeconds(paused, Date.parse("2026-09-18T13:00:00Z")), 19800);
  assert.equal(netSeconds(paused, Date.parse("2026-09-18T14:00:00Z")), 19800);
});
test("vacation rejects declined and cancelled requests from used and reserved totals", () => {
  const requests = [
    { kind: "vacation", status: "approved", days: 4.5 },
    { kind: "vacation", status: "pending", days: 2 },
    { kind: "vacation", status: "rejected", days: 9 },
    { kind: "sick", status: "approved", days: 5 },
  ];
  assert.deepEqual(leaveBalance(requests, 30), {
    approved: 4.5,
    pending: 2,
    remaining: 25.5,
    available: 23.5,
  });
});
test("Berlin manual dates handle daylight saving and reject ambiguous or impossible times", () => {
  assert.equal(berlinInstant("2026-09-18T08:00"), "2026-09-18T06:00:00.000Z");
  assert.equal(berlinInstant("2026-01-18T08:00"), "2026-01-18T07:00:00.000Z");
  assert.equal(berlinInstant("2026-03-29T02:30"), null);
  assert.equal(berlinInstant("2026-10-25T02:30"), null);
  assert.equal(berlinInstant("2026-02-30T08:00"), null);
  assert.equal(validDay("2026-02-30"), false);
});
test("wage and entitlement inputs reject scientific notation, negative and non-half leave days", () => {
  assert.equal(decimalInput("16,50", 1000), 16.5);
  for (const value of ["1e3", "-2", "Infinity", "12.123", "1001"])
    assert.equal(decimalInput(value, 1000), null);
  assert.equal(decimalInput("24.5", 366, true), 24.5);
  assert.equal(decimalInput("24.3", 366, true), null);
});
