import Link from "next/link";
import {
  ArrowUpRight,
  CircleUserRound,
  Gift,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { AuthForm, WaitlistForm } from "@/components/CommunityForms";
import { CustomerProfileForm, NewsletterForm } from "@/components/PortalForms";
import { PortalHeader, PortalNavigation } from "@/components/PortalShell";
import { PortalArrival } from "@/components/PortalArrival";
import { PointsHistory } from "@/components/PointsHistory";
import {
  createSupabaseServer,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { adminRole, formatPoints } from "@/lib/portal/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dein Kundenportal | LACACCINO",
  robots: { index: false, follow: false },
};

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; welcome?: string; deleted?: string }>;
}) {
  const query = await searchParams;
  const enabled =
    isSupabaseConfigured() && Boolean(process.env.SUPABASE_SECRET_KEY);
  const supabase = enabled ? await createSupabaseServer() : null;
  const auth = supabase ? await supabase.auth.getUser() : null;
  const user = auth?.data.user;
  if (!user || !supabase)
    return (
      <main className="account-page shell portal-login">
        <Link className="wordmark" href="/">
          LACACCINO
        </Link>
        <div className="portal-login__grid">
          <div className="account-heading">
            <p className="eyebrow">Dein Kundenportal</p>
            <h1>
              Ein Platz.
              <br />
              <em>Ganz für dich.</em>
            </h1>
            <p>
              Deine Angaben, deine Nachrichten und dein zukünftiges Punktekonto
              – an einem Ort.
            </p>
            <ul className="portal-benefits">
              <li>
                <CircleUserRound size={19} aria-hidden="true" /> Persönliche
                Angaben einfach verwalten
              </li>
              <li>
                <Gift size={19} aria-hidden="true" /> Punktekonto für den
                späteren Shop
              </li>
              <li>
                <Mail size={19} aria-hidden="true" /> Du entscheidest, welche
                E-Mails du erhältst
              </li>
            </ul>
            <p className="form-note">Der Marktstart ist für 2029 geplant.</p>
          </div>
          <div className="community-card account-auth">
            {query.deleted === "1" && <p role="status" className="form-feedback form-feedback--success">Dein Kundenkonto wurde gelöscht. Du bist abgemeldet.</p>}
            {query.error && (
              <p role="alert" className="form-feedback">
                Der Zugang konnte nicht abgeschlossen werden. Bitte melde dich
                erneut an.
              </p>
            )}
            <AuthForm
              enabled={enabled}
              emailEnabled={process.env.AUTH_EMAIL_ENABLED === "true"}
            />
          </div>
        </div>
        <Link className="text-link" href="/">
          Zurück zur Markenwelt
        </Link>
      </main>
    );
  const [profile, waitlist, points, entries, newsletter, role] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name,last_name,phone,display_name")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("waitlist_entries")
        .select("created_at")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("loyalty_accounts")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("loyalty_entries")
        .select("id,amount,reason,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("newsletter_preferences")
        .select("subscribed")
        .eq("user_id", user.id)
        .maybeSingle(),
      adminRole(user.id),
    ]);
  const name = profile.data?.first_name || profile.data?.display_name;
  return (
    <>
      <PortalHeader />
      {query.welcome === "1" && <PortalArrival />}
      <main className="portal shell">
        <div className="portal-welcome" id="uebersicht">
          <div>
            <p className="eyebrow">Dein LACACCINO</p>
            <h1 id="portal-heading" tabIndex={-1}>
              {name ? (
                <>
                  Ciao, <em>{name}.</em>
                </>
              ) : (
                <>
                  Schön, dass <em>du da bist.</em>
                </>
              )}
            </h1>
            <p>Dein nächster Kaffeemoment beginnt hier.</p>
          </div>
          {role && (
            <Link className="text-link" href="/admin">
              Zur Administration <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          )}
        </div>
        <div className="portal-layout">
          <aside className="portal-sidebar">
            <PortalNavigation />
            <p className="portal-sidebar__note">
              Marktstart 2029
              <br />
              <span>Gemeinsam am Anfang.</span>
            </p>
          </aside>
          <div className="portal-content">
            <section
              className="portal-points-card"
              aria-labelledby="balance-title"
            >
              <div>
                <p className="eyebrow" id="balance-title">
                  Dein Punktekonto
                </p>
                <p className="points-total">
                  {points.error
                    ? "—"
                    : formatPoints(Number(points.data?.balance || 0))}
                  <span>Punkte</span>
                </p>
                <p>
                  {points.error
                    ? "Dein Punktestand ist gerade nicht verfügbar. Bitte lade die Seite erneut."
                    : "Dein Konto ist bereit. Mit dem späteren Onlineshop beginnt das Sammeln."}
                </p>
                <a className="text-link" href="#punkte">
                  Buchungen ansehen{" "}
                  <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>
              <div className="portal-seal" aria-hidden="true">
                <span>L</span>
                <small>LACACCINO</small>
              </div>
            </section>
            <section className="portal-shop-note">
              <Gift size={23} aria-hidden="true" />
              <div>
                <h2>Vorfreude auf mehr.</h2>
                <p>
                  Der Onlineshop ist in Planung. Sammelregeln und Prämien werden
                  vor dem Start bekannt gegeben. Aktuell gibt es keine Bestell-
                  oder Einlösemöglichkeit und keinen festgelegten Geldwert der
                  Punkte.
                </p>
              </div>
              <span className="portal-badge">In Planung</span>
            </section>
            <section className="portal-panel" id="punkte">
              <div className="portal-section-heading">
                <div>
                  <p className="eyebrow">Alles nachvollziehbar</p>
                  <h2>Deine Punktehistorie</h2>
                </div>
                <span className="portal-subtle">Letzte 30 Buchungen</span>
              </div>
              {entries.error ? (
                <p role="alert">Die Buchungen konnten nicht geladen werden.</p>
              ) : (
                <PointsHistory entries={entries.data || []} />
              )}
            </section>
            <section className="portal-panel" id="profil">
              <div className="portal-section-heading">
                <div>
                  <p className="eyebrow">Das bist du</p>
                  <h2>Persönliche Angaben</h2>
                </div>
                <CircleUserRound size={24} aria-hidden="true" />
              </div>
              {profile.error ? (
                <p role="alert">Dein Profil ist gerade nicht verfügbar.</p>
              ) : (
                <CustomerProfileForm
                  profile={{
                    first_name: profile.data?.first_name || "",
                    last_name: profile.data?.last_name || "",
                    phone: profile.data?.phone || "",
                  }}
                  email={user.email || ""}
                />
              )}
            </section>
            <section id="nachrichten" className="portal-preferences">
              <div className="portal-panel">
                <p className="eyebrow">Post von LACACCINO</p>
                <h2>Dein Newsletter</h2>
                {newsletter.error ? (
                  <p role="alert">
                    Deine Einstellung ist gerade nicht verfügbar.
                  </p>
                ) : (
                  <NewsletterForm
                    subscribed={newsletter.data?.subscribed === true}
                  />
                )}
              </div>
              <div className="portal-panel" id="warteliste">
                <p className="eyebrow">Für den ersten Moment</p>
                <h2>Die Warteliste</h2>
                {waitlist.error ? (
                  <p role="alert">
                    Dein Wartelistenstatus ist gerade nicht verfügbar.
                  </p>
                ) : (
                  <WaitlistForm joined={Boolean(waitlist.data)} />
                )}
              </div>
            </section>
            <section className="portal-panel portal-security" id="sicherheit">
              <ShieldCheck size={25} aria-hidden="true" />
              <div>
                <h2>Zugang & Sicherheit</h2>
                <p>
                  Deine Daten gehören dir. Hier kannst du dein Passwort ändern
                  oder uns zu deinem Konto kontaktieren.
                </p>
                <div className="portal-inline-links">
                  <Link href="/konto/passwort">Passwort ändern</Link>
                  <Link href="/kontakt">Hilfe & Kontakt</Link>
                  {!role && <Link href="/konto/loeschen">Konto löschen</Link>}
                  <Link href="/datenschutz">Datenschutz</Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
