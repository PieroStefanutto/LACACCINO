import { requireStaff } from "@/lib/staff/server";
import { PortalHeader } from "@/components/PortalShell";
import { StaffPasswordForm } from "@/components/StaffForms";
export const metadata = {
  title: "Mitarbeiter-Passwort | LACACCINO",
  robots: { index: false, follow: false },
};
export default async function PasswordPage() {
  const { staff } = await requireStaff(true);
  return (
    <>
      <PortalHeader employee />
      <main className="portal shell">
        <section className="portal-panel staff-narrow">
          <p className="eyebrow">Dein persönlicher Zugang</p>
          <h1>Passwort festlegen.</h1>
          <p>
            {staff.must_change_password
              ? "Lege vor dem ersten Zugriff dein eigenes Passwort fest."
              : "Hier kannst du dein Passwort ändern."}
          </p>
          <StaffPasswordForm />
        </section>
      </main>
    </>
  );
}
