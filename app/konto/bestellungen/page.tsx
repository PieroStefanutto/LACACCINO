import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { AccountSection } from "@/components/AccountSection";
import { requireCustomerSession, formatDate } from "@/lib/portal/server";
import { accountPage, euro, orderStatuses } from "@/lib/portal/shop";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Bestellhistorie | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user, supabase } = await requireCustomerSession();
  const page = accountPage((await searchParams).page);
  const orders = await supabase
    .from("shop_orders")
    .select(
      "id,order_number,status,total_cents,created_at,shop_order_items(id,product_name,variant_name,quantity,unit_price_cents)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .order("id")
    .range(page * 20, page * 20 + 20);
  return (
    <AccountSection
      title="Bestellhistorie"
      intro="Deine Bestellungen und die kleinen Momente dahinter."
      current="bestellungen"
    >
      {orders.error ? (
        <p className="portal-panel" role="alert">
          Deine Bestellungen konnten nicht geladen werden.
        </p>
      ) : orders.data?.length ? (
        <>
          {orders.data.slice(0, 20).map((order) => (
            <article className="portal-panel order-card" key={order.id}>
              <div className="portal-section-heading">
                <div>
                  <p className="eyebrow">Bestellung {order.order_number}</p>
                  <h2>{formatDate(order.created_at)}</h2>
                </div>
                <span className="portal-badge">
                  {orderStatuses[order.status] || order.status}
                </span>
              </div>
              <ul className="order-items">
                {order.shop_order_items.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>
                        {item.quantity} × {item.product_name}
                      </strong>
                      {item.variant_name && <small>{item.variant_name}</small>}
                      <small>Einzelpreis {euro(item.unit_price_cents)}</small>
                    </div>
                    <span>{euro(item.quantity * item.unit_price_cents)}</span>
                  </li>
                ))}
              </ul>
              <p className="order-total">
                <span>Bestellsumme</span>
                <strong>{euro(order.total_cents)}</strong>
              </p>
              <Link className="text-link" href="/kontakt">
                Frage zu dieser Bestellung
              </Link>
            </article>
          ))}
        </>
      ) : (
        <section className="portal-panel portal-empty">
          <ShoppingBag size={36} aria-hidden="true" />
          <h2>
            {page
              ? "Keine weiteren Bestellungen."
              : "Dein erster Kaffeemoment kommt noch."}
          </h2>
          <p>
            Hier erscheinen deine Bestellungen, sobald unser Onlineshop geöffnet
            ist. Aktuell hast du noch keine Bestellung auf dieser Seite.
          </p>
          <Link className="text-link" href="/konto/rabattcodes">
            Deine Rabattcodes entdecken
          </Link>
        </section>
      )}
      <nav className="portal-inline-links" aria-label="Bestellseiten">
        {page > 0 && (
          <Link href={`/konto/bestellungen?page=${page - 1}`}>
            ← Neuere Bestellungen
          </Link>
        )}
        {(orders.data?.length || 0) > 20 && (
          <Link href={`/konto/bestellungen?page=${page + 1}`}>
            Ältere Bestellungen →
          </Link>
        )}
      </nav>
    </AccountSection>
  );
}
