import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";

export const demoPeople = {
  mila: { id: "10000000-0000-4000-8000-000000000001", label: "Mila · Kundin" },
  jonas: {
    id: "10000000-0000-4000-8000-000000000002",
    label: "Jonas · zweites Kundenkonto",
  },
  team: {
    id: "10000000-0000-4000-8000-000000000003",
    label: "Alex · Mitarbeiter",
  },
  leitung: {
    id: "10000000-0000-4000-8000-000000000004",
    label: "Kim · Standortleitung",
  },
  admin: {
    id: "10000000-0000-4000-8000-000000000005",
    label: "Robin · Administration",
  },
} as const;

async function databaseSources() {
  const names = (await readdir(resolve("supabase/migrations")))
    .filter((n) => n.endsWith(".sql"))
    .sort();
  const migrations = await Promise.all(
    names.map(async (name) => ({
      name,
      sql: await readFile(resolve("supabase/migrations", name), "utf8"),
    })),
  );
  const bootstrap = await readFile(
    resolve("supabase/demo/bootstrap.sql"),
    "utf8",
  );
  const seed = await readFile(resolve("supabase/demo/seed.sql"), "utf8");
  const fingerprint = createHash("sha256")
    .update(bootstrap + seed + migrations.map((m) => m.name + m.sql).join(""))
    .digest("hex")
    .slice(0, 16);
  return { migrations, bootstrap, seed, fingerprint };
}

export async function createLocalDatabase(
  memory = true,
  seed = true,
  sources = databaseSources(),
) {
  const source = await sources;
  // A changed schema gets a fresh directory; earlier fictional work stays intact.
  const directory = resolve(
    process.cwd(),
    "artifacts/club-demo/database-" + source.fingerprint,
  );
  if (!memory) await mkdir(directory, { recursive: true });
  const db = new PGlite(memory ? undefined : directory);
  await db.waitReady;
  const marker = await db.query<{ marker: string | null }>(
    "select to_regclass('public._club_local_only')::text marker",
  );
  if (!marker.rows[0].marker) {
    await db.exec(source.bootstrap);
    await db.exec(
      "create table public._club_local_migrations(name text primary key)",
    );
  }
  for (const { name: file, sql } of source.migrations) {
    const applied = await db.query(
      "select name from public._club_local_migrations where name=$1",
      [file],
    );
    if (!applied.rows.length) {
      await db.exec(sql);
      await db.query(
        "insert into public._club_local_migrations(name) values($1)",
        [file],
      );
    }
  }
  if (
    seed &&
    !(await db.query("select id from auth.users limit 1")).rows.length
  ) {
    await db.exec(source.seed);
  }
  return db;
}

export async function localQuery<T>(
  db: PGlite,
  userId: string | null,
  sql: string,
  args: unknown[] = [],
  aal = "aal2",
) {
  return db.transaction(async (tx) => {
    await tx.query(
      "select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)",
      [userId || "", JSON.stringify({ sub: userId, aal })],
    );
    await tx.exec(
      userId ? "set local role authenticated" : "set local role anon",
    );
    return (await tx.query<T>(sql, args)).rows;
  });
}

const globalStore = globalThis as typeof globalThis & {
  clubDatabases?: Map<string, Promise<PGlite>>;
};
export async function demoDatabase() {
  // Defense in depth: this module has no URL/client that could connect to Supabase.
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.APP_ENV !== "local" ||
    process.env.CLUB_MODE !== "demo" ||
    process.env.VERCEL
  )
    throw new Error("Local demo unavailable");
  const source = await databaseSources();
  const databases = (globalStore.clubDatabases ??= new Map());
  if (!databases.has(source.fingerprint))
    databases.set(
      source.fingerprint,
      createLocalDatabase(false, true, Promise.resolve(source)),
    );
  return databases.get(source.fingerprint)!;
}
