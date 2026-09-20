export function clubMode(
  env: Record<string, string | undefined> = process.env,
): "off" | "demo" | "supabase" {
  // Preview variables must never enable the unfinished Club on a production deployment.
  if (env.VERCEL_ENV === "production" || env.APP_ENV === "production") return "off";
  if (
    env.CLUB_MODE === "demo" &&
    env.APP_ENV === "local" &&
    env.NODE_ENV === "development" &&
    !env.VERCEL
  )
    return "demo";
  // Production is deliberately not enabled by this first local delivery.
  if (
    env.CLUB_MODE === "supabase" &&
    env.APP_ENV === "preview" &&
    env.SUPABASE_URL &&
    env.CLUB_SUPABASE_PROJECT_REF
  ) {
    try {
      const url = new URL(env.SUPABASE_URL);
      if (
        url.protocol === "https:" &&
        url.hostname === `${env.CLUB_SUPABASE_PROJECT_REF}.supabase.co` &&
        env.CLUB_SUPABASE_PROJECT_REF !== "midxwtzhytzvbmidpvsl"
      )
        return "supabase";
    } catch {
      /* Invalid configuration stays disabled. */
    }
  }
  return "off";
}

export function safeClubDestination(value: unknown) {
  const allowed = [
    "/club",
    "/club/karte",
    "/club/vorteile",
    "/club/profil",
    "/club/getraenke",
    "/club/standorte",
    "/club/neuigkeiten",
    "/club/nachrichten",
    "/club/team",
    "/club/admin",
  ];
  return typeof value === "string" && allowed.includes(value) ? value : "/club";
}

export const commerceModules = [
  {
    name: "Vorbestellen & abholen",
    state: "Deaktiviert",
    missing:
      "Bestätigte Cafés, Sortiment, Preise, Abholzeiten und Testzahlung fehlen.",
  },
  {
    name: "Onlineshop",
    state: "Deaktiviert",
    missing: "Produkte, Bestand, Steuern, Versand und Zahlungsfreigabe fehlen.",
  },
  {
    name: "Geschenkgutscheine",
    state: "Deaktiviert",
    missing:
      "Gutscheinbedingungen, Zahlungsanbieter und Guthabenprüfung fehlen.",
  },
  {
    name: "Kaffee-Abonnements",
    state: "Deaktiviert",
    missing: "Intervalle, Preise, Kündigungsregeln und Testzahlungen fehlen.",
  },
] as const;
