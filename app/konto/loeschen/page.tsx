import Link from "next/link";
import { AccountSection } from "@/components/AccountSection";
import { DeleteAccountForm } from "@/components/AccountServiceForms";
import { requireCustomerSession, adminRole } from "@/lib/portal/server";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Konto löschen | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function DeleteAccountPage() {
  const { user } = await requireCustomerSession();
  const role = await adminRole(user.id);
  return (
    <AccountSection
      title="Konto löschen"
      intro="Du entscheidest, ob du bei uns bleiben möchtest."
      current="sicherheit"
    >
      <section className="portal-panel account-delete-panel">
        <h2>Eine endgültige Entscheidung.</h2>
        {role ? (
          <>
            <p>
              Administrationskonten können hier nicht gelöscht werden. Für
              Änderungen am Admin-Zugang verwende die Administration.
            </p>
            <Link className="text-link" href="/admin">
              Zur Administration
            </Link>
          </>
        ) : (
          <>
            <p>
              Du löschst dein Kundenkonto für <strong>{user.email}</strong>.
              Danach ist keine Anmeldung mit diesem Konto mehr möglich.
            </p>
            <ul>
              <li>Profil und optionale Telefonnummer werden gelöscht.</li>
              <li>
                Newsletter, Einwilligungsnachweise und Wartelisteneintrag werden
                entfernt.
              </li>
              <li>
                Punktekonto, Punktehistorie und persönliche Rabattcodes werden
                gelöscht.
              </li>
              <li>
                Der Zugriff auf deine Bestellhistorie und Lieblingsprodukte
                endet.
              </li>
            </ul>
            <p>
              Die Löschung ist nicht rückgängig zu machen und storniert keine
              Bestellungen. Gesetzlich aufzubewahrende Bestellbelege werden
              getrennt vom Konto behandelt. Frühere Kontaktanfragen sowie
              technische Protokolle und Sicherungskopien werden nicht
              automatisch durch diesen Schritt gelöscht. Für weitergehende
              Löschungsanfragen <Link href="/kontakt">kontaktiere uns</Link>.
              Mehr dazu im <Link href="/datenschutz">Datenschutz</Link>.
            </p>
            <DeleteAccountForm />
          </>
        )}
      </section>
    </AccountSection>
  );
}
