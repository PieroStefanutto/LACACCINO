export function clubMode(
  env: Record<string, string | undefined> = process.env,
): "off" | "demo" | "supabase" {
  const productionProject = "midxwtzhytzvbmidpvsl";
  const isProduction = env.VERCEL_ENV === "production" || env.APP_ENV === "production";
  // Production needs an explicit release switch and the migrated production DB.
  // Copying preview variables into Production must never connect test accounts.
  if (isProduction) {
    return env.APP_ENV === "production" &&
      (!env.VERCEL_ENV || env.VERCEL_ENV === "production") &&
      env.CLUB_MODE === "supabase" &&
      env.CLUB_PRODUCTION_ENABLED === "true" &&
      env.CLUB_SUPABASE_PROJECT_REF === productionProject &&
      env.SUPABASE_URL?.replace(/\/$/, "") === `https://${productionProject}.supabase.co`
      ? "supabase"
      : "off";
  }
  if (
    env.CLUB_MODE === "demo" &&
    env.APP_ENV === "local" &&
    env.NODE_ENV === "development" &&
    !env.VERCEL
  )
    return "demo";
  // Preview remains isolated from the existing production database.
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
        env.CLUB_SUPABASE_PROJECT_REF !== productionProject
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
