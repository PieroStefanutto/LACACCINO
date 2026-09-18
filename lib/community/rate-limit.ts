import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function allowRequest(kind: string, limit: number) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) return false;
  const h = await headers();
  const ip = process.env.VERCEL
    ? h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    : "local";
  if (!ip) return false;
  const bucket = createHmac("sha256", secret)
    .update(`${kind}:${ip}`)
    .digest("hex");
  const { data, error } = await createSupabaseAdmin().rpc(
    "lacaccino_take_rate_limit",
    { bucket_key: bucket, request_limit: limit },
  );
  if (error) throw new Error("Rate limit unavailable");
  return data === true;
}
