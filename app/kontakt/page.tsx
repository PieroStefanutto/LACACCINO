import Link from "next/link";
import { ContactForm } from "@/components/CommunityForms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kontakt | LACACCINO" };

export default function ContactPage() {
  return <main className="account-page shell"><Link className="wordmark" href="/">LACACCINO</Link><div className="account-heading"><p className="eyebrow">Im Gespräch bleiben</p><h1>Deine Gedanken.<br />Unser nächster Austausch.</h1><p>Eine Frage zur Marke oder eine Idee für die Zukunft? Schreib uns.</p></div><div className="community-card account-auth"><ContactForm enabled={Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY)} /></div><Link className="text-link" href="/">Zurück zur Markenwelt</Link></main>;
}
