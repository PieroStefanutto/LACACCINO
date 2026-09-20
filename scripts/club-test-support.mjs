import { createClient } from "@supabase/supabase-js";
import { createHmac } from "node:crypto";

export const TEST_PROJECT_REF = "cilstsrnidvmtcugjyns";
export function testEnvironment() {
  process.loadEnvFile(".env.club-test.local");
  if (
    process.env.APP_ENV !== "preview" ||
    process.env.CLUB_MODE !== "supabase" ||
    process.env.CLUB_SUPABASE_PROJECT_REF !== TEST_PROJECT_REF ||
    process.env.SUPABASE_URL !== `https://${TEST_PROJECT_REF}.supabase.co`
  )
    throw new Error(
      "Only the explicitly authorized Club test project may be used.",
    );
  if (!process.env.SUPABASE_PUBLISHABLE_KEY || !process.env.SUPABASE_SECRET_KEY)
    throw new Error("Test credentials are missing.");
  const options = {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  };
  const client = () =>
    createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY,
      options,
    );
  const service = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    options,
  );
  return { client, service };
}
export async function value(promise) {
  const { data, error } = await promise;
  if (error)
    throw new Error(
      `Provider operation failed: ${error.code || error.status || "unknown"}`,
    );
  return data;
}
// RFC 6238; used solely to verify real Supabase TOTP with ephemeral test factors.
export function totp(secret, time = Date.now()) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits = [...secret.replace(/=+$/, "").toUpperCase()]
    .map((c) => {
      const n = alphabet.indexOf(c);
      if (n < 0) throw new Error("Invalid test TOTP secret.");
      return n.toString(2).padStart(5, "0");
    })
    .join("");
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8)
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 30000)));
  const digest = createHmac("sha1", Buffer.from(bytes))
    .update(counter)
    .digest();
  const offset = digest[digest.length - 1] & 15;
  return ((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000)
    .toString()
    .padStart(6, "0");
}
export async function enableTestMfa(client) {
  const factor = await value(
    client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Ephemeral integration test",
    }),
  );
  await value(
    client.auth.mfa.challengeAndVerify({
      factorId: factor.id,
      code: totp(factor.totp.secret),
    }),
  );
  return factor;
}
