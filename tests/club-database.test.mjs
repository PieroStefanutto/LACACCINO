import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  createLocalDatabase,
  localQuery,
  demoPeople,
} from "../lib/club/local-database.ts";

test("Club SQL: real migrations, RLS, membership, ledger, rewards, events and roles", async (t) => {
  const db = await createLocalDatabase();
  t.after(() => db.close());
  const u = Object.fromEntries(
    Object.entries(demoPeople).map(([k, v]) => [k, v.id]),
  );
  const loc = "20000000-0000-4000-8000-000000000001",
    otherLoc = "20000000-0000-4000-8000-000000000002";
  const reward = "70000000-0000-4000-8000-000000000001",
    variant = "60000000-0000-4000-8000-000000000001";
  const rpc = async (who, name, args = {}) =>
    (
      await localQuery(
        db,
        u[who],
        `select public.${name}(${Object.keys(args)
          .map((k, i) => `${k}=>$${i + 1}`)
          .join(",")}) result`,
        Object.values(args),
      )
    )[0].result;
  const book = (extra = {}) => ({
    card: "LC-DEMO-MILA",
    location: loc,
    operation: "award",
    amount: 5000,
    reference_text: randomUUID(),
    reason_text: "Lokaler Testbeleg",
    request_id: randomUUID(),
    ...extra,
  });
  await t.test(
    "anonymous access and direct writes fail; customers see only their membership",
    async () => {
      await assert.rejects(
        localQuery(db, null, "select * from public.club_memberships"),
        /permission denied/,
      );
      assert.equal(
        (await localQuery(db, u.mila, "select * from public.club_memberships"))
          .length,
        1,
      );
      assert.equal(
        (
          await localQuery(
            db,
            u.mila,
            "select * from public.club_memberships where user_id=$1",
            [u.jonas],
          )
        ).length,
        0,
      );
      await assert.rejects(
        localQuery(
          db,
          u.mila,
          "update public.loyalty_accounts set balance=9999",
        ),
        /permission denied/,
      );
      await assert.rejects(
        localQuery(
          db,
          u.mila,
          "insert into public.club_staff_roles values($1,$2,'manager')",
          [u.mila, loc],
        ),
        /permission denied/,
      );
      await assert.rejects(
        rpc("mila", "club_admin_snapshot"),
        /CLUB_FORBIDDEN/,
      );
      await assert.rejects(
        localQuery(
          db,
          u.admin,
          "select public.club_admin_snapshot()",
          [],
          "aal1",
        ),
        /CLUB_FORBIDDEN/,
      );
    },
  );
  await t.test(
    "membership is idempotent; favourites persist and cannot cross accounts",
    async () => {
      assert.equal(
        await rpc("mila", "club_join"),
        await rpc("mila", "club_join"),
      );
      const id = await rpc("mila", "club_save_favourite", {
        favourite_id: null,
        selected_variant: variant,
        label: "Mein Morgen",
      });
      assert.equal(
        (await rpc("mila", "club_snapshot")).favourites[0].nickname,
        "Mein Morgen",
      );
      assert.equal((await rpc("jonas", "club_snapshot")).favourites.length, 0);
      await assert.rejects(
        rpc("jonas", "club_save_favourite", {
          favourite_id: id,
          selected_variant: variant,
          label: "Fremdes Getränk",
        }),
        /CLUB_NOT_FOUND/,
      );
      await assert.rejects(
        rpc("mila", "club_save_favourite", {
          favourite_id: null,
          selected_variant: randomUUID(),
          label: "Ungültig",
        }),
        /CLUB_VARIANT/,
      );
    },
  );
  await t.test(
    "staff scope, QR is identification only; idempotency and receipt deduplication",
    async () => {
      const args = book();
      await assert.rejects(
        rpc("mila", "club_book_points", args),
        /CLUB_FORBIDDEN/,
      );
      await assert.rejects(
        rpc("team", "club_book_points", { ...args, location: otherLoc }),
        /CLUB_FORBIDDEN/,
      );
      await assert.rejects(
        rpc("team", "club_book_points", { ...args, operation: "correction" }),
        /CLUB_FORBIDDEN/,
      );
      assert.equal(await rpc("team", "club_book_points", args), 50);
      assert.equal(await rpc("team", "club_book_points", args), 50);
      await assert.rejects(
        rpc("team", "club_book_points", { ...args, amount: 9000 }),
        /CLUB_CONFLICT/,
      );
      await assert.rejects(
        rpc("team", "club_book_points", { ...args, request_id: randomUUID() }),
        /duplicate key/,
      );
      const lookup = await rpc("team", "club_lookup", {
        card: "LC1:40000000-0000-4000-8000-000000000001",
        location: loc,
      });
      assert.equal(lookup.balance, 50);
      assert.equal(lookup.email, undefined);
      assert.equal(lookup.phone, undefined);
    },
  );
  await t.test(
    "reward retry, competing requests, insufficient funds and single fulfilment",
    async () => {
      const id = randomUUID();
      assert.equal(
        await rpc("mila", "club_reserve_reward", { reward, request_id: id }),
        id,
      );
      assert.equal(
        await rpc("mila", "club_reserve_reward", { reward, request_id: id }),
        id,
      );
      assert.equal((await rpc("mila", "club_snapshot")).balance, 30);
      const competing = await Promise.allSettled([
        rpc("mila", "club_reserve_reward", {
          reward,
          request_id: randomUUID(),
        }),
        rpc("mila", "club_reserve_reward", {
          reward,
          request_id: randomUUID(),
        }),
      ]);
      assert.equal(competing.filter((x) => x.status === "fulfilled").length, 1);
      assert.equal((await rpc("mila", "club_snapshot")).balance, 10);
      await assert.rejects(
        rpc("jonas", "club_finish_reward", {
          redemption: id,
          location: loc,
          cancel: true,
        }),
        /CLUB_FORBIDDEN/,
      );
      await rpc("team", "club_finish_reward", {
        redemption: id,
        location: loc,
        cancel: false,
      });
      await rpc("team", "club_finish_reward", {
        redemption: id,
        location: loc,
        cancel: false,
      });
      await assert.rejects(
        rpc("mila", "club_finish_reward", {
          redemption: id,
          location: loc,
          cancel: true,
        }),
        /CLUB_CONFLICT/,
      );
      await assert.rejects(
        rpc(
          "leitung",
          "club_book_points",
          book({ operation: "correction", amount: -999 }),
        ),
        /CLUB_BALANCE/,
      );
    },
  );
  await t.test(
    "event capacity and marketing opt-out are enforced",
    async () => {
      const event = "80000000-0000-4000-8000-000000000002";
      const results = await Promise.allSettled([
        rpc("mila", "club_event_signup", { event, joining: true }),
        rpc("jonas", "club_event_signup", { event, joining: true }),
      ]);
      assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
      await rpc("mila", "club_save_profile", {
        given_name: "Mila",
        family_name: "Beispiel",
        telephone: "",
        preferred: null,
        order_messages: true,
        marketing: true,
      });
      await rpc("mila", "club_save_profile", {
        given_name: "Mila",
        family_name: "Beispiel",
        telephone: "",
        preferred: null,
        order_messages: true,
        marketing: false,
      });
      const exp = await rpc("mila", "club_export");
      assert.equal(exp.club.newsletter, false);
      assert.equal(exp.newsletter_history.length, 2);
      assert.equal(
        await rpc("mila", "club_request_deletion"),
        await rpc("mila", "club_request_deletion"),
      );
    },
  );
  await t.test("suspension invalidates the card for booking", async () => {
    await rpc("admin", "club_admin_save", {
      entity: "member",
      payload: {
        id: "30000000-0000-4000-8000-000000000001",
        status: "suspended",
      },
    });
    await assert.rejects(
      rpc("team", "club_book_points", book()),
      /CLUB_NOT_FOUND/,
    );
    await assert.rejects(
      rpc("mila", "club_reserve_reward", { reward, request_id: randomUUID() }),
      /CLUB_AUTH/,
    );
    await rpc("mila", "club_set_marketing", { subscribed: false });
    await rpc("mila", "club_request_deletion");
  });
  await t.test(
    "Wallet storage is private; points and deletion queue updates without duplicate identities",
    async () => {
      const memberId = "30000000-0000-4000-8000-000000000002";
      await db.query(
        "insert into public.club_wallet_passes(member_id,provider,provider_identifier,authentication_token_encrypted) values($1,'apple','test-apple-jonas','encrypted-test-placeholder'),($1,'google','test-google-jonas',null)",
        [memberId],
      );
      await assert.rejects(
        localQuery(db, u.jonas, "select * from public.club_wallet_passes"),
        /permission denied/,
      );
      await assert.rejects(
        db.query(
          "insert into public.club_wallet_passes(member_id,provider,provider_identifier) values($1,'google','different-id')",
          [memberId],
        ),
        /duplicate key/,
      );
      await rpc(
        "team",
        "club_book_points",
        book({ card: "LC-DEMO-JONAS", amount: 200 }),
      );
      assert.equal(
        (await db.query("select count(*)::int n from public.club_wallet_jobs"))
          .rows[0].n,
        2,
      );
      await db.query("delete from auth.users where id=$1", [u.jonas]);
      const m = (
        await db.query("select * from public.club_memberships where id=$1", [
          memberId,
        ])
      ).rows[0];
      assert.equal(m.status, "closed");
      assert.equal(m.user_id, null);
      assert.equal(
        (await db.query("select count(*)::int n from public.club_wallet_jobs"))
          .rows[0].n,
        4,
      );
    },
  );
  await t.test(
    "Legacy endpoint cannot bypass the Club ledger and direct RPC rate limits apply",
    async () => {
      await assert.rejects(
        localQuery(
          db,
          u.admin,
          "select public.portal_adjust_points($1,100,$2,$3)",
          [u.mila, "Legacy bypass test", randomUUID()],
        ),
        /CLUB_FORBIDDEN/,
      );
      // Fill only this isolated user's export bucket, not a global shared limiter.
      await db.query(
        "delete from public.club_action_limits where user_id=$1 and operation='export'",
        [u.mila],
      );
      for (let i = 0; i < 10; i++) await rpc("mila", "club_export");
      await assert.rejects(rpc("mila", "club_export"), /CLUB_RATE/);
    },
  );
});

test("Empty database starts without invented locations, rewards, members or points", async () => {
  const db = await createLocalDatabase(true, false);
  try {
    for (const table of [
      "club_memberships",
      "club_locations",
      "club_rewards",
      "loyalty_entries",
    ])
      assert.equal(
        (await db.query(`select count(*)::int n from public.${table}`)).rows[0]
          .n,
        0,
      );
  } finally {
    await db.close();
  }
});
