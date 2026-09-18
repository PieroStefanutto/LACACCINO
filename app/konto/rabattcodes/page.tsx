import { TicketPercent } from "lucide-react";
import { AccountSection } from "@/components/AccountSection";
import { CouponActivation } from "@/components/AccountServiceForms";
import { requireCustomerSession } from "@/lib/portal/server";
import { euro } from "@/lib/portal/shop";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Meine Rabattcodes | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function CouponsPage() {
  const { user, supabase } = await requireCustomerSession();
  const coupons = await supabase
    .from("customer_coupons")
    .select(
      "id,offer_slot,discount_percent,minimum_cents,code,activated_at,redeemed_at",
    )
    .eq("user_id", user.id)
    .order("offer_slot");
  return (
    <AccountSection
      title="Meine Rabattcodes"
      intro="Heute aktivieren. Beim späteren Shopstart genießen."
      current="rabattcodes"
    >
      <section className="portal-panel coupon-intro">
        <TicketPercent size={28} aria-hidden="true" />
        <div>
          <h2>Fünf Vorteile. Für deine Kaffeemomente.</h2>
          <p>
            Dreimal 10 % ab 50 € Warenwert, einmal 15 % ab 150 € und einmal 20 %
            ab 500 €. Aktiviere jeden Gutschein einzeln, damit dein persönlicher
            Code hier bereitliegt.
          </p>
          <p className="form-note">
            Der Onlineshop ist noch nicht geöffnet. Aktivieren verbraucht keinen
            Gutschein und löst keine Bestellung aus.
          </p>
        </div>
      </section>
      {coupons.error ? (
        <p role="alert" className="portal-panel">
          Deine Rabattcodes konnten nicht geladen werden. Bitte versuche es
          erneut.
        </p>
      ) : coupons.data?.length ? (
        <div className="coupon-grid">
          {coupons.data.map((coupon) => (
            <article className="portal-panel coupon-card" key={coupon.id}>
              <p className="eyebrow">
                {coupon.offer_slot <= 3
                  ? `10-%-Vorteil ${coupon.offer_slot} von 3`
                  : "Dein Einkaufsvorteil"}
              </p>
              <h2>
                <span className="coupon-percent">
                  {coupon.discount_percent} %
                </span>
                <span>Rabatt ab {euro(coupon.minimum_cents)}</span>
              </h2>
              <p>Einmal pro Code · für dein Kundenkonto</p>
              <CouponActivation
                id={coupon.id}
                activated={Boolean(coupon.activated_at)}
                redeemed={Boolean(coupon.redeemed_at)}
                code={coupon.activated_at ? coupon.code : ""}
              />
            </article>
          ))}
        </div>
      ) : (
        <p className="portal-panel">
          Für dieses Konto stehen derzeit keine Gutscheine bereit. Gutscheine
          sind für bestätigte Kundenkonten vorgesehen.
        </p>
      )}
      <section className="portal-panel">
        <h2>So sind deine Vorteile gedacht.</h2>
        <ul className="portal-conditions">
          <li>
            Jeder Code ist einmal für dein eigenes Konto im zukünftigen
            LACACCINO-Onlineshop nutzbar.
          </li>
          <li>
            Pro Bestellung ein Code; die Rabatte werden nicht miteinander
            kombiniert.
          </li>
          <li>
            Der Mindestwarenwert gilt vor diesem Rabatt und ohne Versandkosten.
            Der Rabatt gilt auf den Warenwert, nicht auf den Versand.
          </li>
          <li>
            Aktivierte Codes bleiben hier sichtbar. Aktuell ist kein Ablaufdatum
            festgelegt.
          </li>
          <li>
            Einlösen kannst du deine Codes, sobald der Onlineshop öffnet. Der
            Rabatt wird dir dann vor dem Kauf angezeigt.
          </li>
        </ul>
      </section>
    </AccountSection>
  );
}
