import Link from "next/link";
import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/CommunityForms";
import { createSupabaseServer, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Passwort ändern | LACACCINO", robots: { index: false, follow: false } };

export default async function PasswordPage() {
  if (!isSupabaseConfigured()) redirect("/konto");
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/konto");
  return <main className="account-page shell"><Link className="wordmark" href="/">LACACCINO</Link><div className="account-heading"><p className="eyebrow">Dein Konto</p><h1>Ein neues Passwort.</h1></div><div className="community-card account-auth"><PasswordForm /></div><Link className="text-link" href="/konto">Zurück zum Konto</Link></main>;
}
