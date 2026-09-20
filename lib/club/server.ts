import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { clubMode, safeClubDestination } from "./config";
import type { ClubSnapshot } from "./types";

export async function clubIdentity() {
  const mode = clubMode();
  if (mode === "off") return null;
  if (mode === "demo") {
    const host = (await headers()).get("host") || "";
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) return null;
    const { demoPeople } = await import("./local-database");
    const key = (await cookies()).get("lc-local-persona")?.value;
    if (!key || !Object.hasOwn(demoPeople, key)) return null;
    return { mode, id: demoPeople[key as keyof typeof demoPeople].id };
  }
  const supabase = await createSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return null;
  return { mode, id: user.id };
}

// Names are supplied by server code only, never interpolated from a browser input.
export async function clubRpc<T>(
  name: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  const identity = await clubIdentity();
  if (!identity) throw new Error("CLUB_AUTH");
  if (!/^club_[a-z_]+$/.test(name)) throw new Error("CLUB_INPUT");
  if (identity.mode === "demo") {
    const { demoDatabase, localQuery } = await import("./local-database");
    const keys = Object.keys(params);
    if (keys.some((k) => !/^[a-z_]+$/.test(k))) throw new Error("CLUB_INPUT");
    const args = keys.map((k, i) => `${k} => $${i + 1}`).join(",");
    const rows = await localQuery<{ result: T }>(
      await demoDatabase(),
      identity.id,
      `select public.${name}(${args}) as result`,
      Object.values(params),
    );
    return rows[0].result;
  }
  const { data, error } = await (
    await createSupabaseServer()
  ).rpc(name, params);
  if (error) throw new Error(error.message);
  return data as T;
}

export async function clubData(destination = "/club") {
  if (!(await clubIdentity()))
    redirect(
      `/club/anmelden?next=${encodeURIComponent(safeClubDestination(destination))}`,
    );
  return clubRpc<ClubSnapshot>("club_snapshot");
}

export function clubError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const messages: Record<string, string> = {
    CLUB_RATE: "Zu viele Vorgänge in kurzer Zeit. Bitte warte eine Minute.",
    CLUB_AUTH:
      "Bitte melde dich erneut an. Eine aktive, bestätigte Mitgliedschaft wird benötigt.",
    CLUB_CUSTOMER:
      "Mitarbeiter- und Administrationskonten verwenden ihren eigenen Club-Bereich.",
    CLUB_FORBIDDEN:
      "Dafür fehlen die erforderliche Rolle oder die Berechtigung für diesen Standort.",
    CLUB_NOT_FOUND:
      "Der Eintrag wurde nicht gefunden oder ist nicht verfügbar.",
    CLUB_VARIANT:
      "Diese Getränkekombination ist nicht mehr verfügbar. Bitte wähle eine andere.",
    CLUB_LOCATION: "Bitte wähle einen bestätigten, geöffneten Standort.",
    CLUB_RULE: "Für diesen Standort ist noch keine Punkteregel freigegeben.",
    CLUB_ZERO:
      "Dieser Betrag ergibt nach der aktuellen Regel noch keinen Punkt.",
    CLUB_BALANCE:
      "Der Punktestand reicht dafür nicht aus. Es wurde nichts abgebucht.",
    CLUB_CONFLICT:
      "Dieser Vorgang wurde bereits anders verarbeitet. Bitte lade den aktuellen Stand.",
    CLUB_REWARD: "Diese Prämie ist nicht mehr verfügbar oder abgelaufen.",
    CLUB_CAPACITY:
      "Es ist kein Platz mehr verfügbar oder die Kapazität liegt unter den Anmeldungen.",
    CLUB_LIMIT: "Das Limit ist erreicht. Bitte entferne zuerst einen Eintrag.",
    CLUB_INPUT: "Bitte prüfe deine Eingaben.",
  };
  for (const [code, text] of Object.entries(messages))
    if (message.includes(code)) return text;
  if (/duplicate key/.test(message))
    return "Diesen Eintrag oder diese Vorgangsreferenz gibt es bereits. Es wurde nichts doppelt gebucht.";
  if (/constraint|invalid input|out of range|null value/.test(message))
    return "Bitte prüfe die Pflichtfelder, Werte und Gültigkeitszeiträume.";
  return "Der Vorgang konnte nicht abgeschlossen werden. Bitte versuche es erneut. Es wird kein Erfolg vorgetäuscht.";
}
