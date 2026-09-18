"use client";
import { useActionState } from "react";
import Link from "next/link";
import {
  registerCustomer,
  requestLoginLink,
  updateCustomerProfile,
  setNewsletter,
  adminLogin,
  changeAdminPassword,
  bookPoints,
  updateContactStatus,
} from "@/app/portal-actions";
import { emptyState, type FormState } from "@/lib/community/validation";

function Feedback({ state }: { state: FormState }) {
  return (
    <p
      className={`form-feedback${state.ok ? " form-feedback--success" : ""}`}
      role="status"
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

function NameFields({
  profile,
}: {
  profile?: { first_name: string; last_name: string; phone: string };
}) {
  return (
    <>
      <div className="portal-form-row">
        <label htmlFor="first-name">
          Vorname
          <input
            id="first-name"
            name="first_name"
            autoComplete="given-name"
            maxLength={80}
            defaultValue={profile?.first_name}
            required
          />
        </label>
        <label htmlFor="last-name">
          Nachname
          <input
            id="last-name"
            name="last_name"
            autoComplete="family-name"
            maxLength={80}
            defaultValue={profile?.last_name}
            required
          />
        </label>
      </div>
      <label htmlFor="customer-phone">
        Telefonnummer <span className="optional-label">(optional)</span>
        <input
          id="customer-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
          defaultValue={profile?.phone}
        />
      </label>
    </>
  );
}

export function RegistrationForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(registerCustomer, emptyState);
  return (
    <form action={action} className="community-form">
      <p className="form-note">
        Dein persönlicher Zugang kommt per E-Mail-Link. Du brauchst kein neues
        Passwort.
      </p>
      <fieldset disabled={!enabled || pending || state.ok}>
        <NameFields />
        <label htmlFor="register-email">
          E-Mail-Adresse
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label className="form-check">
          <input type="checkbox" name="newsletter" value="yes" />
          <span>
            Ja, ich möchte den LACACCINO-Newsletter mit Markenneuigkeiten und
            späteren Shop-Angeboten per E-Mail erhalten. Freiwillig und
            jederzeit im Portal oder per Nachricht widerrufbar.
          </span>
        </label>
        <label className="form-check">
          <input type="checkbox" name="terms" value="yes" required />
          <span>
            Ich habe die <Link href="/agb">Nutzungshinweise</Link> gelesen.
            Informationen zur Verarbeitung meiner Daten stehen im{" "}
            <Link href="/datenschutz">Datenschutz</Link>.
          </span>
        </label>
        <button className="button" type="submit">
          {pending ? "Wird vorbereitet …" : "Konto erstellen"}
        </button>
      </fieldset>
      {!enabled && (
        <p className="form-note">
          Neue Registrierungen öffnen nach Einrichtung des E-Mail-Versands.
        </p>
      )}
      <Feedback state={state} />
    </form>
  );
}

export function LoginLinkForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(requestLoginLink, emptyState);
  return (
    <form action={action} className="community-form">
      <fieldset disabled={!enabled || pending || state.ok}>
        <label htmlFor="link-email">
          E-Mail-Adresse
          <input
            id="link-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <button className="button" type="submit">
          {pending ? "Einen Moment …" : "Anmeldelink anfordern"}
        </button>
      </fieldset>
      {!enabled && (
        <p className="form-note">
          E-Mail-Links sind noch nicht verfügbar. Für bestehende Konten nutze
          bitte „Mit Passwort“.
        </p>
      )}
      <Feedback state={state} />
    </form>
  );
}

export function CustomerProfileForm({
  profile,
  email,
}: {
  profile: { first_name: string; last_name: string; phone: string };
  email: string;
}) {
  const [state, action, pending] = useActionState(
    updateCustomerProfile,
    emptyState,
  );
  return (
    <form action={action} className="community-form">
      <fieldset disabled={pending}>
        <NameFields profile={profile} />
        <label htmlFor="profile-email">
          E-Mail-Adresse
          <input id="profile-email" value={email} readOnly type="email" />
          <span className="form-note">
            Eine neue E-Mail-Adresse muss bestätigt werden. Für Änderungen{" "}
            <Link href="/kontakt">kontaktiere uns</Link>.
          </span>
        </label>
        <button className="button" type="submit">
          {pending ? "Wird gespeichert …" : "Angaben speichern"}
        </button>
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function NewsletterForm({ subscribed }: { subscribed: boolean }) {
  const [state, action, pending] = useActionState(setNewsletter, emptyState);
  return (
    <form action={action} className="community-form">
      <input
        type="hidden"
        name="intent"
        value={subscribed ? "unsubscribe" : "subscribe"}
      />
      <p className={`portal-badge ${subscribed ? "portal-badge--active" : ""}`}>
        {subscribed ? "Abonniert" : "Nicht abonniert"}
      </p>
      <p className="form-note">
        {subscribed
          ? "Du hast dem Newsletter zugestimmt. Du kannst deine Einwilligung hier jederzeit zurücknehmen."
          : "Markenneuigkeiten und spätere Shop-Angebote per E-Mail. Mit „Newsletter abonnieren“ willigst du ein. Freiwillig und jederzeit widerrufbar."}{" "}
        Der Versand startet nach Einrichtung unseres Maildienstes.{" "}
        <Link href="/datenschutz">Datenschutz</Link>
      </p>
      <button
        className="button button--outline"
        disabled={pending}
        type="submit"
      >
        {pending
          ? "Wird gespeichert …"
          : subscribed
            ? "Newsletter abbestellen"
            : "Newsletter abonnieren"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, emptyState);
  return (
    <form action={action} className="community-form">
      <fieldset disabled={pending}>
        <label htmlFor="admin-username">
          Benutzername
          <input
            id="admin-username"
            name="username"
            autoComplete="username"
            maxLength={60}
            required
          />
        </label>
        <label htmlFor="admin-password">
          Passwort
          <input
            id="admin-password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={128}
            required
          />
        </label>
        <button className="button" type="submit">
          {pending ? "Wird geprüft …" : "Administration öffnen"}
        </button>
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function AdminPasswordForm() {
  const [state, action, pending] = useActionState(
    changeAdminPassword,
    emptyState,
  );
  return (
    <form action={action} className="community-form">
      <fieldset disabled={pending}>
        <label htmlFor="admin-new-password">
          Neues Passwort
          <input
            id="admin-new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <label htmlFor="admin-confirm-password">
          Passwort wiederholen
          <input
            id="admin-confirm-password"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <p className="form-note">
          Mindestens 12 Zeichen. Wähle ein eigenes Passwort, das du nicht
          bereits anderswo verwendest.
        </p>
        <button className="button" type="submit">
          {pending ? "Wird gespeichert …" : "Passwort speichern"}
        </button>
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function PointsForm({
  userId,
  requestKey,
}: {
  userId: string;
  requestKey: string;
}) {
  const [state, action, pending] = useActionState(bookPoints, emptyState);
  return (
    <form action={action} className="community-form">
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="request_key" value={requestKey} />
      <fieldset disabled={pending || state.ok}>
        <label htmlFor="points-amount">
          Punkteänderung
          <input
            id="points-amount"
            name="amount"
            type="number"
            min={-1000000}
            max={1000000}
            step={1}
            required
          />
          <span className="form-note">
            Positive Zahl: Gutschrift. Negative Zahl: Korrektur. Das Guthaben
            darf nicht unter null fallen.
          </span>
        </label>
        <label htmlFor="points-reason">
          Buchungsgrund
          <input
            id="points-reason"
            name="reason"
            minLength={3}
            maxLength={200}
            required
          />
          <span className="form-note">
            Der Kunde sieht diesen Grund in seiner Historie.
          </span>
        </label>
        <button className="button" type="submit">
          {pending
            ? "Wird gebucht …"
            : state.ok
              ? "Buchung gespeichert"
              : "Punkte verbindlich buchen"}
        </button>
      </fieldset>
      <Feedback state={state} />
      {state.ok && (
        <p className="form-note">
          Für eine weitere, eigenständige Buchung diese Seite neu laden.
        </p>
      )}
    </form>
  );
}

export function ContactStatusForm({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(
    updateContactStatus,
    emptyState,
  );
  return (
    <form action={action} className="portal-status-form">
      <input type="hidden" name="id" value={id} />
      <label htmlFor={`contact-status-${id}`}>
        Bearbeitungsstatus
        <select
          id={`contact-status-${id}`}
          name="status"
          defaultValue={status}
          disabled={pending}
        >
          <option value="new">Neu</option>
          <option value="in_progress">In Bearbeitung</option>
          <option value="closed">Erledigt</option>
        </select>
      </label>
      <button
        className="button button--outline"
        type="submit"
        disabled={pending}
      >
        Speichern
      </button>
      <Feedback state={state} />
    </form>
  );
}
