import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, formatPoints } from "@/lib/portal/server";
import { isUuid } from "@/lib/portal/validation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/PortalShell";
import { PointsForm } from "@/components/PortalForms";
import { PointsHistory } from "@/components/PointsHistory";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Kundenverwaltung | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function CustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const db = createSupabaseAdmin();
  const [account, profile, points, entries, newsletter, role] =
    await Promise.all([
      db.auth.admin.getUserById(id),
      db
        .from("profiles")
        .select("first_name,last_name,phone")
        .eq("id", id)
        .maybeSingle(),
      db
        .from("loyalty_accounts")
        .select("balance")
        .eq("user_id", id)
        .maybeSingle(),
      db
        .from("loyalty_entries")
        .select("id,amount,reason,created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(30),
      db
        .from("newsletter_preferences")
        .select("subscribed,updated_at")
        .eq("user_id", id)
        .maybeSingle(),
      db
        .from("portal_admins")
        .select("user_id")
        .eq("user_id", id)
        .maybeSingle(),
    ]);
  if (account.error || !account.data.user || role.data) notFound();
  const name =
    [profile.data?.first_name, profile.data?.last_name]
      .filter(Boolean)
      .join(" ") || "Kundenkonto";
  return (
    <>
      <PortalHeader admin />
      <main className="portal shell">
        <Link className="text-link" href="/admin">
          ← Alle Kunden
        </Link>
        <div className="portal-welcome">
          <div>
            <p className="eyebrow">Kundenbetreuung</p>
            <h1>{name}</h1>
            <p>{account.data.user.email}</p>
          </div>
        </div>
        <div className="admin-customer-grid">
          <section className="portal-panel">
            <p className="eyebrow">Kontodetails</p>
            <h2>Persönliche Angaben</h2>
            {profile.error ? (
              <p role="alert">Profil konnte nicht geladen werden.</p>
            ) : (
              <dl className="portal-details">
                <dt>Vorname</dt>
                <dd>{profile.data?.first_name || "Nicht angegeben"}</dd>
                <dt>Nachname</dt>
                <dd>{profile.data?.last_name || "Nicht angegeben"}</dd>
                <dt>Telefon</dt>
                <dd>{profile.data?.phone || "Nicht angegeben"}</dd>
                <dt>Newsletter</dt>
                <dd>
                  {newsletter.error
                    ? "Nicht verfügbar"
                    : newsletter.data?.subscribed
                      ? "Abonniert"
                      : "Nicht abonniert"}
                </dd>
                <dt>E-Mail bestätigt</dt>
                <dd>{account.data.user.email_confirmed_at ? "Ja" : "Nein"}</dd>
              </dl>
            )}
            <p className="form-note">
              Newsletter-Einwilligungen kann nur der Kunde selbst erteilen oder
              zurücknehmen.
            </p>
          </section>
          <section className="portal-panel">
            <p className="eyebrow">Aktueller Punktestand</p>
            <p className="points-total">
              {points.error
                ? "—"
                : formatPoints(Number(points.data?.balance || 0))}
              <span>Punkte</span>
            </p>
            <h2>Punkte buchen</h2>
            {points.error ? (
              <p role="alert">Punktekonto konnte nicht geladen werden.</p>
            ) : (
              <PointsForm userId={id} requestKey={randomUUID()} />
            )}
          </section>
        </div>
        <section className="portal-panel">
          <h2>Buchungshistorie</h2>
          <p className="form-note">
            Letzte 30 Buchungen. Korrekturen erfolgen als neue Buchung;
            bestehende Einträge bleiben nachvollziehbar.
          </p>
          {entries.error ? (
            <p role="alert">Historie konnte nicht geladen werden.</p>
          ) : (
            <PointsHistory entries={entries.data || []} />
          )}
        </section>
      </main>
    </>
  );
}
