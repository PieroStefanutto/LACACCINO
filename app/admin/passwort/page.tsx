import { requireAdmin } from "@/lib/portal/server";
import { AdminPasswordForm } from "@/components/PortalForms";
import { PortalHeader } from "@/components/PortalShell";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Admin-Passwort | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function AdminPasswordPage() {
  const { role } = await requireAdmin(true);
  return (
    <>
      <PortalHeader admin />
      <main className="account-page shell">
        <div className="account-heading">
          <p className="eyebrow">Administration / Sicherheit</p>
          <h1>Dein eigener Zugang.</h1>
          <p>
            {role.must_change_password
              ? "Ersetze das vorgegebene Startpasswort vor dem ersten Zugriff auf Kundendaten durch ein eigenes Passwort."
              : "Hier kannst du dein Admin-Passwort ändern."}
          </p>
        </div>
        <div className="community-card account-auth">
          <AdminPasswordForm />
        </div>
      </main>
    </>
  );
}
