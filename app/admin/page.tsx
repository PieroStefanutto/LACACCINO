import Link from "next/link";
import { requireAdmin, formatDate, formatPoints } from "@/lib/portal/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { PortalHeader } from "@/components/PortalShell";
import { ContactStatusForm } from "@/components/PortalForms";
import { StaffRefresh } from "@/components/StaffForms";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Administration | LACACCINO",
  robots: { index: false, follow: false },
};
type Customer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  balance: number;
  subscribed: boolean;
  created_at: string;
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const query = await searchParams;
  const search = (query.q || "").trim().slice(0, 80);
  const page = Math.min(
    2000,
    Math.max(0, Number.parseInt(query.page || "0", 10) || 0),
  );
  const [customers, contacts, staffRequests] = await Promise.all([
    supabase.rpc("portal_customer_list", {
      search_term: search,
      page_offset: page * 50,
    }),
    createSupabaseAdmin()
      .from("contact_requests")
      .select("id,name,email,message,status,created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("staff_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);
  const rows = (customers.data || []) as Customer[];
  return (
    <>
      <PortalHeader admin />
      <main className="portal shell">
        <div className="portal-welcome">
          <div>
            <p className="eyebrow">LACACCINO / Administration</p>
            <h1>
              Deine Marke.
              <br />
              <em>Dein Überblick.</em>
            </h1>
            <p>Kunden betreuen, Punkte verwalten und Anfragen bearbeiten.</p>
          </div>
          <Link className="text-link" href="/admin/passwort">
            Admin-Passwort ändern
          </Link>
        </div>
        <nav className="admin-section-nav" aria-label="Administration">
          <a href="#kunden">Kunden & Punkte</a>
          <a href="#anfragen">Kontaktanfragen</a>
          <Link href="/admin/mitarbeiter">Mitarbeiter & Anträge{staffRequests.error ? " · Status nicht verfügbar" : ` (${staffRequests.count || 0} offen)`}</Link>
        </nav>
        <StaffRefresh />
        <section className="portal-panel" id="kunden">
          <div className="portal-section-heading">
            <div>
              <p className="eyebrow">Persönlicher Service</p>
              <h2>Kunden & Punktekonten</h2>
            </div>
          </div>
          <form method="get" className="admin-search">
            <label htmlFor="customer-search">
              Nach Name oder E-Mail suchen
              <input
                id="customer-search"
                name="q"
                defaultValue={search}
                maxLength={80}
                type="search"
              />
            </label>
            <button className="button" type="submit">
              Suchen
            </button>
          </form>
          {customers.error ? (
            <p role="alert">Die Kunden konnten nicht geladen werden.</p>
          ) : rows.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <caption>Kundenübersicht – Seite {page + 1}</caption>
                <thead>
                  <tr>
                    <th scope="col">Kunde</th>
                    <th scope="col">Punkte</th>
                    <th scope="col">Newsletter</th>
                    <th scope="col">Seit</th>
                    <th scope="col">Verwaltung</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <strong>
                          {[customer.first_name, customer.last_name]
                            .filter(Boolean)
                            .join(" ") || "Name noch offen"}
                        </strong>
                        <span>{customer.email}</span>
                      </td>
                      <td>{formatPoints(Number(customer.balance))}</td>
                      <td>
                        {customer.subscribed ? "Abonniert" : "Nicht abonniert"}
                      </td>
                      <td>{formatDate(customer.created_at)}</td>
                      <td>
                        <Link
                          className="text-link"
                          href={`/admin/kunden/${customer.id}`}
                        >
                          Öffnen
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="portal-empty">
              Keine Kunden für diese Suche gefunden.
            </p>
          )}
          <div className="portal-inline-links">
            {page > 0 && (
              <Link
                href={`/admin?q=${encodeURIComponent(search)}&page=${page - 1}`}
              >
                ← Vorherige Seite
              </Link>
            )}
            {rows.length === 50 && (
              <Link
                href={`/admin?q=${encodeURIComponent(search)}&page=${page + 1}`}
              >
                Weitere Kunden →
              </Link>
            )}
          </div>
        </section>
        <section className="portal-panel" id="anfragen">
          <div className="portal-section-heading">
            <div>
              <p className="eyebrow">Im Gespräch bleiben</p>
              <h2>Kontaktanfragen</h2>
            </div>
            <span className="portal-subtle">Letzte 30 Anfragen</span>
          </div>
          {contacts.error ? (
            <p role="alert">Anfragen konnten nicht geladen werden.</p>
          ) : contacts.data?.length ? (
            <div className="admin-contacts">
              {contacts.data.map((contact) => (
                <details className="admin-contact" key={contact.id}>
                  <summary>
                    <span>
                      <strong>{contact.name}</strong>
                      <small>{formatDate(contact.created_at)}</small>
                    </span>
                    <span className="portal-badge">
                      {contact.status === "new"
                        ? "Neu"
                        : contact.status === "in_progress"
                          ? "In Bearbeitung"
                          : "Erledigt"}
                    </span>
                  </summary>
                  <div>
                    <a className="text-link" href={`mailto:${contact.email}`}>
                      {contact.email}
                    </a>
                    <p className="admin-contact__message">{contact.message}</p>
                    <ContactStatusForm
                      id={contact.id}
                      status={contact.status}
                    />
                  </div>
                </details>
              ))}
            </div>
          ) : (
            <p className="portal-empty">Noch keine Kontaktanfragen.</p>
          )}
        </section>
      </main>
    </>
  );
}
