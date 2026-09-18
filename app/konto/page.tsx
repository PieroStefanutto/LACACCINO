import Link from "next/link";
import {
  AuthForm,
  ProfileForm,
  WaitlistForm,
} from "@/components/CommunityForms";
import {
  createSupabaseServer,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { signOut } from "@/app/community-actions";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Dein Konto | LACACCINO",
  robots: { index: false, follow: false },
};

export default async function Account({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorCode } = await searchParams;
  const enabled =
    isSupabaseConfigured() && Boolean(process.env.SUPABASE_SECRET_KEY);
  const supabase = enabled ? await createSupabaseServer() : null;
  const auth = supabase ? await supabase.auth.getUser() : null;
  const user = auth?.data.user;
  const [profile, waitlist] =
    user && supabase
      ? await Promise.all([
          supabase
            .from("profiles")
            .select("display_name")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("waitlist_entries")
            .select("created_at")
            .eq("user_id", user.id)
            .maybeSingle(),
        ])
      : [null, null];
  return (
    <main className="account-page shell" id="warteliste">
      <Link className="wordmark" href="/">
        LACACCINO
      </Link>
      <div className="account-heading">
        <p className="eyebrow">Dein persönlicher Bereich</p>
        <h1>{user ? "Schön, dass du da bist." : "Ein Platz für dich."}</h1>
        <p>
          {user
            ? user.email
            : "Neuigkeiten zum geplanten Marktstart 2029 – direkt per E-Mail. Melde dich mit deinem bestehenden Konto an und verwalte deinen Platz auf der Warteliste."}
        </p>
      </div>
      {errorCode === "confirmation" && (
        <p className="form-feedback" role="alert">
          Der Bestätigungslink ist abgelaufen oder wurde in einem anderen
          Browser geöffnet. Melde dich an oder fordere über „Passwort vergessen“
          einen neuen Link an.
        </p>
      )}
      {errorCode === "logout" && (
        <p className="form-feedback" role="alert">
          Abmelden ist gerade fehlgeschlagen. Bitte versuche es erneut.
        </p>
      )}
      {user ? (
        <>
          {profile?.error || waitlist?.error ? (
            <p role="alert">
              Deine Kontodaten sind momentan nicht verfügbar. Bitte versuche es
              später noch einmal.
            </p>
          ) : (
            <div className="community-grid">
              <section className="community-card">
                <p className="eyebrow">Dein Profil</p>
                <h2>Wie heißt du?</h2>
                <ProfileForm name={profile?.data?.display_name ?? ""} />
              </section>
              <section className="community-card">
                <p className="eyebrow">Geplanter Markenstart 2029</p>
                <h2>Von Anfang an dabei.</h2>
                <WaitlistForm joined={Boolean(waitlist?.data)} />
              </section>
            </div>
          )}
          <div className="account-links">
            <Link className="text-link" href="/konto/passwort">
              Passwort ändern
            </Link>
            <form action={signOut}>
              <button className="text-link form-text-button" type="submit">
                Abmelden
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="community-card account-auth">
          <AuthForm
            enabled={enabled}
            emailEnabled={process.env.AUTH_EMAIL_ENABLED === "true"}
          />
        </div>
      )}
      <Link className="text-link" href="/">
        Zurück zur Markenwelt
      </Link>
    </main>
  );
}
