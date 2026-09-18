"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { RegistrationForm, LoginLinkForm } from "@/components/PortalForms";
import {
  authenticate,
  changePassword,
  saveProfile,
  sendContact,
  updateWaitlist,
} from "@/app/community-actions";
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

export function ContactForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(sendContact, emptyState);
  return (
    <form action={action} className="community-form">
      <fieldset disabled={!enabled || pending || state.ok}>
        <label htmlFor="contact-name">
          Dein Name
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={100}
            required
          />
        </label>
        <label htmlFor="contact-email">
          E-Mail-Adresse
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        <label htmlFor="contact-message">
          Deine Nachricht
          <textarea
            id="contact-message"
            name="message"
            minLength={10}
            maxLength={4000}
            rows={5}
            required
          />
        </label>
        <div className="form-honeypot" aria-hidden="true">
          <label htmlFor="contact-website">
            Website
            <input
              id="contact-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </label>
        </div>
        <label className="form-check">
          <input type="checkbox" name="consent" value="yes" required />
          <span>
            Meine Angaben dürfen gespeichert werden, um meine Anfrage zu
            bearbeiten.
          </span>
        </label>
        <p className="form-note">
          Wir speichern Name, E-Mail-Adresse und Nachricht. Bitte sende keine
          vertraulichen Angaben. Deine Anfrage ist nicht öffentlich sichtbar. Du
          kannst deine Einwilligung jederzeit für die Zukunft widerrufen.{" "}
          Details findest du in der{" "}
          <Link href="/datenschutz">Datenschutzerklärung</Link>.
        </p>
        <button className="button" type="submit">
          {pending
            ? "Wird gesendet …"
            : state.ok
              ? "Anfrage gespeichert"
              : "Nachricht senden"}
        </button>
      </fieldset>
      {!enabled && (
        <p className="form-note">Das Kontaktformular öffnet in Kürze.</p>
      )}
      <Feedback state={state} />
    </form>
  );
}

export function AuthForm({
  enabled,
  emailEnabled,
}: {
  enabled: boolean;
  emailEnabled: boolean;
}) {
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "magic">(
    "login",
  );
  return (
    <div>
      <div className="form-tabs" aria-label="Kontozugang">
        <button
          type="button"
          aria-pressed={mode === "login"}
          onClick={() => setMode("login")}
        >
          Mit Passwort
        </button>
        <button
          type="button"
          aria-pressed={mode === "signup"}
          onClick={() => setMode("signup")}
        >
          Konto erstellen
        </button>
      </div>
      <button
        className="text-link form-text-button portal-magic-link"
        type="button"
        onClick={() => setMode("magic")}
      >
        Mit E-Mail-Link anmelden
      </button>
      {mode === "signup" ? (
        <RegistrationForm enabled={enabled && emailEnabled} />
      ) : mode === "magic" ? (
        <LoginLinkForm enabled={enabled && emailEnabled} />
      ) : (
        <AuthFields
          key={mode}
          mode={mode}
          enabled={enabled && (mode === "login" || emailEnabled)}
        />
      )}
      <p className="form-note">
        Informationen zu deinen Kontodaten und notwendigen Anmeldecookies:{" "}
        <Link href="/datenschutz">Datenschutz</Link> und{" "}
        <Link href="/cookies">Cookies</Link>. Hinweise zum Angebot:{" "}
        <Link href="/agb">AGB & Nutzungshinweise</Link>.
      </p>
      {!emailEnabled && (
        <p className="form-note">
          Neue Konten und Passwort-E-Mails werden in Kürze freigeschaltet.
          Bestehende Konten können sich anmelden.
        </p>
      )}
      <button
        type="button"
        className="text-link form-text-button"
        onClick={() => setMode(mode === "reset" ? "login" : "reset")}
      >
        {mode === "reset" ? "Zur Anmeldung" : "Passwort vergessen?"}
      </button>
    </div>
  );
}

function AuthFields({
  mode,
  enabled,
}: {
  mode: "login" | "signup" | "reset";
  enabled: boolean;
}) {
  const [state, action, pending] = useActionState(authenticate, emptyState);
  return (
    <form action={action} className="community-form">
      <input type="hidden" name="mode" value={mode} />
      {mode === "reset" && (
        <p className="form-note">
          Wir schicken dir einen Link zum Zurücksetzen deines Passworts.
        </p>
      )}
      <fieldset disabled={!enabled || pending || state.ok}>
        <label htmlFor="auth-email">
          E-Mail-Adresse
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={254}
            required
          />
        </label>
        {mode !== "reset" && (
          <label htmlFor="auth-password">
            Passwort
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              minLength={mode === "signup" ? 12 : undefined}
              maxLength={128}
              required
            />
            {mode === "signup" && (
              <span className="form-note">Mindestens 12 Zeichen.</span>
            )}
          </label>
        )}
        {mode === "signup" && (
          <>
            <label className="form-check">
              <input name="consent" type="checkbox" value="yes" required />
              <span>
                Meine E-Mail-Adresse darf zur Einrichtung und Verwaltung meines
                Kontos gespeichert werden.
              </span>
            </label>
            <p className="form-note">
              Du bestätigst deine Adresse per E-Mail. Die Warteliste ist eine
              separate, freiwillige Anmeldung in deinem Konto.
            </p>
          </>
        )}
        <button className="button" type="submit">
          {pending
            ? "Einen Moment …"
            : mode === "signup"
              ? "Konto erstellen"
              : mode === "reset"
                ? "Link anfordern"
                : "Anmelden"}
        </button>
      </fieldset>
      {!enabled && (
        <p className="form-note">Der Kontobereich öffnet in Kürze.</p>
      )}
      <Feedback state={state} />
    </form>
  );
}

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(saveProfile, emptyState);
  return (
    <form action={action} className="community-form">
      <fieldset disabled={pending}>
        <label htmlFor="profile-name">
          Wie dürfen wir dich nennen?
          <input
            id="profile-name"
            name="display_name"
            defaultValue={name}
            autoComplete="nickname"
            maxLength={100}
          />
        </label>
        <button className="button" type="submit">
          {pending ? "Wird gespeichert …" : "Profil speichern"}
        </button>
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function WaitlistForm({ joined }: { joined: boolean }) {
  const [state, action, pending] = useActionState(updateWaitlist, emptyState);
  return (
    <form action={action} className="community-form">
      <input type="hidden" name="intent" value={joined ? "leave" : "join"} />
      <p
        className={
          joined ? "form-feedback form-feedback--success" : "form-note"
        }
      >
        {joined
          ? "Du bist dabei. Dein Platz auf der Warteliste ist gespeichert. Du kannst dich jederzeit hier wieder abmelden."
          : "Erfahre per E-Mail, wenn es Neuigkeiten zum geplanten Markenstart 2029 gibt."}
      </p>
      <fieldset disabled={pending}>
        {!joined && (
          <label className="form-check">
            <input type="checkbox" name="consent" value="yes" required />
            <span>
              Ich möchte per E-Mail über den Markenstart von LACACCINO
              informiert werden. Ich kann meine Einwilligung jederzeit hier
              widerrufen. Weitere Informationen:{" "}
              <Link href="/datenschutz">Datenschutz</Link>.
            </span>
          </label>
        )}
        <button className="button" type="submit">
          {pending
            ? "Wird gespeichert …"
            : joined
              ? "Von der Warteliste abmelden"
              : "Auf die Warteliste setzen"}
        </button>
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, emptyState);
  return (
    <form action={action} className="community-form">
      <fieldset disabled={pending || state.ok}>
        <label htmlFor="new-password">
          Neues Passwort
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <label htmlFor="confirm-password">
          Passwort wiederholen
          <input
            id="confirm-password"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
        </label>
        <button className="button" type="submit">
          {pending ? "Wird gespeichert …" : "Passwort ändern"}
        </button>
      </fieldset>
      <Feedback state={state} />
    </form>
  );
}
