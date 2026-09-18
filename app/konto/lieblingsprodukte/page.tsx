import Link from "next/link";
import { Heart } from "lucide-react";
import { AccountSection } from "@/components/AccountSection";
import { requireCustomerSession, formatDate } from "@/lib/portal/server";
import { accountPage } from "@/lib/portal/shop";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Meine Lieblingsprodukte | LACACCINO",
  robots: { index: false, follow: false },
};
type Favourite = {
  product_key: string;
  product_name: string;
  variant_name: string;
  quantity: number;
  last_ordered_at: string;
};
export default async function FavouritesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { supabase } = await requireCustomerSession();
  const page = accountPage((await searchParams).page);
  const result = await supabase.rpc("portal_favourite_products", {
    page_offset: page * 50,
  });
  const products = (result.data || []) as Favourite[];
  return (
    <AccountSection
      title="Meine Lieblingsprodukte"
      intro="Was du schon bestellt hast, findest du hier wieder."
      current="lieblingsprodukte"
    >
      {result.error ? (
        <p className="portal-panel" role="alert">
          Deine Lieblingsprodukte konnten nicht geladen werden.
        </p>
      ) : products.length ? (
        <>
          <p className="form-note">
            Automatisch aus deinen bezahlten Bestellungen zusammengestellt.
            Stornierte und vollständig erstattete Bestellungen werden nicht
            berücksichtigt.
          </p>
          <div className="favourite-grid">
            {products.map((product) => (
              <article
                className="portal-panel favourite-card"
                key={`${product.product_key}:${product.variant_name}`}
              >
                <Heart size={24} aria-hidden="true" />
                <h2>{product.product_name}</h2>
                {product.variant_name && <p>{product.variant_name}</p>}
                <p>{product.quantity} Stück bisher bestellt</p>
                <p className="form-note">
                  Zuletzt am {formatDate(product.last_ordered_at)}
                </p>
                <Link className="text-link" href="/konto/bestellungen">
                  Zur Bestellhistorie
                </Link>
              </article>
            ))}
          </div>
        </>
      ) : (
        <section className="portal-panel portal-empty">
          <Heart size={36} aria-hidden="true" />
          <h2>
            {page
              ? "Keine weiteren Lieblingsprodukte."
              : "Platz für deine Favoriten."}
          </h2>
          <p>
            Nach deinem ersten bezahlten Einkauf findest du hier automatisch
            deine bereits bestellten Artikel. Der Onlineshop ist noch in
            Planung.
          </p>
          <Link className="text-link" href="/konto/bestellungen">
            Zur Bestellhistorie
          </Link>
        </section>
      )}
      <nav className="portal-inline-links" aria-label="Lieblingsproduktseiten">
        {page > 0 && (
          <Link href={`/konto/lieblingsprodukte?page=${page - 1}`}>
            ← Vorherige Seite
          </Link>
        )}
        {products.length === 50 && (
          <Link href={`/konto/lieblingsprodukte?page=${page + 1}`}>
            Weitere Produkte →
          </Link>
        )}
      </nav>
    </AccountSection>
  );
}
