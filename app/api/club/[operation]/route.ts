import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { clubMode, safeClubDestination } from "@/lib/club/config";
import { clubRpc, clubError, clubIdentity } from "@/lib/club/server";
import { createSupabaseServer, siteOrigin } from "@/lib/supabase/server";
import { allowRequest } from "@/lib/community/rate-limit";
import { validEmail, validPassword } from "@/lib/community/validation";
import type { ClubSnapshot } from "@/lib/club/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (value: unknown, status = 200) =>
  NextResponse.json(value, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
const attempts = new Map<string, { count: number; until: number }>();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ operation: string }> },
) {
  const { operation } = await params;
  const mode = clubMode();
  if (mode === "off")
    return json(
      { error: "Der Club ist in dieser Umgebung noch nicht freigeschaltet." },
      503,
    );
  const allowedOrigins =
    mode === "demo"
      ? ["http://127.0.0.1:3120", "http://localhost:3120"]
      : [siteOrigin()];
  if (!allowedOrigins.includes(request.headers.get("origin") || ""))
    return json({ error: "Ungültiger Ursprung." }, 403);
  if (
    mode === "demo" &&
    !/^(localhost|127\.0\.0\.1)$/.test(request.nextUrl.hostname)
  )
    return json({ error: "Lokale Demo erforderlich." }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 16000) return json({ error: "Zu viele Daten." }, 413);
    const body: Record<string, unknown> = JSON.parse(raw);
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new Error("CLUB_INPUT");
    const s = (key: string) =>
      typeof body[key] === "string" ? (body[key] as string).trim() : "";
    const b = (key: string) =>
      body[key] === true || body[key] === "on" || body[key] === "true";
    const id = (key: string) => s(key) || null;
    const n = (key: string) => {
      if (!/^-?\d{1,9}$/.test(s(key))) throw new Error("CLUB_INPUT");
      return Number(s(key));
    };
    if (operation === "demo-login") {
      if (mode !== "demo") return json({ error: "Demo nicht verfügbar." }, 404);
      const { demoPeople } = await import("@/lib/club/local-database");
      if (!Object.hasOwn(demoPeople, s("persona")))
        throw new Error("CLUB_INPUT");
      (await cookies()).set("lc-local-persona", s("persona"), {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        maxAge: 3600 * 8,
      });
      return json({ ok: true, redirect: safeClubDestination(s("next")) });
    }
    if (operation === "auth") {
      if (mode !== "supabase")
        return json(
          {
            error:
              "Die Demo verwendet fiktive Testpersonen und versendet keine E-Mails.",
          },
          400,
        );
      if (!(await allowRequest("club-auth", 8)))
        return json(
          { error: "Bitte warte etwas vor einem weiteren Versuch." },
          429,
        );
      const email = s("email").toLowerCase();
      if (!validEmail(email)) throw new Error("CLUB_INPUT");
      const client = await createSupabaseServer();
      const next = safeClubDestination(s("next"));
      const callback = `${siteOrigin()}/auth/callback?next=${encodeURIComponent(next)}`;
      if (s("mode") === "password") {
        const password = body.password;
        if (typeof password !== "string" || !validPassword(password))
          throw new Error("CLUB_INPUT");
        const { error } = await client.auth.signInWithPassword({
          email,
          password,
        });
        if (error)
          return json(
            {
              error:
                "Anmeldung fehlgeschlagen. Prüfe Adresse, Passwort und E-Mail-Bestätigung.",
            },
            400,
          );
        return json({ ok: true, redirect: next });
      }
      if (process.env.AUTH_EMAIL_ENABLED !== "true")
        return json(
          {
            error:
              "E-Mail-Anmeldung und Passwort-E-Mails sind noch nicht eingerichtet.",
          },
          503,
        );
      if (s("mode") === "reset") {
        await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteOrigin()}/auth/callback?next=/konto/passwort`,
        });
      } else if (["register", "link"].includes(s("mode"))) {
        if (
          s("mode") === "register" &&
          (!b("terms") ||
            !s("first_name") ||
            s("first_name").length > 80 ||
            !s("last_name") ||
            s("last_name").length > 80 ||
            s("phone").length > 40)
        )
          throw new Error("CLUB_INPUT");
        const { error } = await client.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: s("mode") === "register",
            emailRedirectTo: callback,
            ...(s("mode") === "register"
              ? {
                  data: {
                    first_name: s("first_name"),
                    last_name: s("last_name"),
                    phone: s("phone"),
                    newsletter: b("newsletter"),
                    newsletter_version: "newsletter-2026-09-18",
                    account_version: "club-2026-09-20",
                  },
                }
              : {}),
          },
        });
        if (error && s("mode") === "register")
          return json(
            {
              error:
                "Die Registrierung ist gerade nicht möglich. Bitte versuche es später erneut.",
            },
            400,
          );
      } else throw new Error("CLUB_INPUT");
      return json({
        ok: true,
        message:
          "Falls die Anfrage möglich ist, erhältst du eine E-Mail. Öffne den Link in diesem Browser.",
      });
    }
    const identity = await clubIdentity();
    if (!identity) return json({ error: "Bitte melde dich erneut an." }, 401);
    if (mode === "supabase") {
      if (
        !(await allowRequest(
          `club-${operation}`,
          operation === "lookup" ? 60 : 30,
        ))
      )
        return json(
          { error: "Bitte warte etwas vor einem weiteren Versuch." },
          429,
        );
    } else {
      const key = `${identity.id}:${operation}`;
      const current = attempts.get(key);
      if (!current || current.until < Date.now())
        attempts.set(key, { count: 1, until: Date.now() + 60000 });
      else if (++current.count > 60)
        return json({ error: "Bitte warte eine Minute." }, 429);
    }
    if (operation === "logout") {
      if (mode === "demo") (await cookies()).delete("lc-local-persona");
      else {
        const { error } = await (
          await createSupabaseServer()
        ).auth.signOut({ scope: "local" });
        if (error) throw error;
      }
      return json({ ok: true, redirect: "/club/anmelden" });
    }
    if (operation === "mfa-enroll" || operation === "mfa-verify") {
      if (mode !== "supabase") throw new Error("CLUB_INPUT");
      const data = await clubRpc<ClubSnapshot>("club_snapshot");
      if (!data.privileged) throw new Error("CLUB_FORBIDDEN");
      const client = await createSupabaseServer();
      if (operation === "mfa-enroll") {
        const { data: factors, error: factorError } =
          await client.auth.mfa.listFactors();
        if (factorError) throw factorError;
        const existing = factors.totp.find((f) => f.status === "verified");
        if (existing) return json({ ok: true, factorId: existing.id });
        const { data: factor, error } = await client.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: "LACACCINO Club",
        });
        if (error) throw error;
        return json({ ok: true, factorId: factor.id, qr: factor.totp.qr_code });
      }
      if (!/^\d{6}$/.test(s("code"))) throw new Error("CLUB_INPUT");
      const { error } = await client.auth.mfa.challengeAndVerify({
        factorId: s("factor_id"),
        code: s("code"),
      });
      if (error)
        return json(
          {
            error:
              "Der Code konnte nicht bestätigt werden. Bitte prüfe den aktuellen Code.",
          },
          400,
        );
      return json({
        ok: true,
        message: "Zweiter Faktor bestätigt.",
        redirect: "/club",
      });
    }
    let result: unknown;
    switch (operation) {
      case "newsletter":
        result = await clubRpc("club_set_marketing", {
          subscribed: b("newsletter"),
        });
        break;
      case "join":
        result = await clubRpc("club_join");
        break;
      case "favourite":
        result = await clubRpc("club_save_favourite", {
          favourite_id: id("id"),
          selected_variant: s("variant_id"),
          label: s("nickname"),
        });
        break;
      case "remove-favourite":
        result = await clubRpc("club_remove_favourite", {
          favourite_id: s("id"),
        });
        break;
      case "profile":
        result = await clubRpc("club_save_profile", {
          given_name: s("first_name"),
          family_name: s("last_name"),
          telephone: s("phone"),
          preferred: id("preferred_location"),
          order_messages: b("order_notifications"),
          marketing: b("newsletter"),
        });
        break;
      case "reserve":
        result = await clubRpc("club_reserve_reward", {
          reward: s("reward_id"),
          request_id: s("request_id"),
        });
        break;
      case "finish-reward":
        result = await clubRpc("club_finish_reward", {
          redemption: s("id"),
          location: id("location_id"),
          cancel: b("cancel"),
        });
        break;
      case "lookup":
        result = await clubRpc("club_lookup", {
          card: s("card"),
          location: s("location_id"),
        });
        break;
      case "book":
        result = await clubRpc("club_book_points", {
          card: s("card"),
          location: s("location_id"),
          operation: s("kind"),
          amount: n("amount"),
          reference_text: s("reference"),
          reason_text: s("reason"),
          request_id: s("request_id"),
          original_entry: id("original_entry"),
        });
        break;
      case "event":
        result = await clubRpc("club_event_signup", {
          event: s("id"),
          joining: b("joining"),
        });
        break;
      case "read":
        result = await clubRpc("club_mark_read", { notification: s("id") });
        break;
      case "delete-request":
        if (s("confirmation") !== "LÖSCHEN") throw new Error("CLUB_INPUT");
        result = await clubRpc("club_request_deletion");
        break;
      case "admin": {
        const allowed = [
          "location",
          "drink",
          "variant",
          "reward",
          "rule",
          "content",
          "member",
          "staff_role",
          "deletion",
        ];
        if (!allowed.includes(s("entity"))) throw new Error("CLUB_INPUT");
        result = await clubRpc("club_admin_save", {
          entity: s("entity"),
          payload: body,
        });
        break;
      }
      default:
        return json({ error: "Unbekannte Aktion." }, 404);
    }
    return json({
      ok: true,
      result,
      message:
        operation === "reserve"
          ? "Prämie reserviert. Die Punkte wurden abgebucht. Zeige deine Karte bei der Ausgabe vor."
          : operation === "book"
            ? `Gebucht. Neuer Punktestand: ${result}.`
            : operation === "delete-request"
              ? "Deine Löschungsanfrage ist eingegangen. Dein Konto ist noch nicht gelöscht."
              : "Gespeichert. Dein Stand ist aktuell.",
    });
  } catch (error) {
    return json({ error: clubError(error) }, 400);
  }
}
