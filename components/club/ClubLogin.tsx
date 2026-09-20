"use client";
import { useState } from "react";
import Link from "next/link";
import { ClubForm } from "./ClubForm";

export function ClubLogin({
  emailEnabled,
  next,
}: {
  emailEnabled: boolean;
  next: string;
}) {
  const [mode, setMode] = useState("password");
  return (
    <>
      <div className="club-tabs" role="group" aria-label="Zugangsart">
        <button
          type="button"
          aria-pressed={mode === "password"}
          onClick={() => setMode("password")}
        >
          Anmelden
        </button>
        <button
          type="button"
          aria-pressed={mode === "register"}
          onClick={() => setMode("register")}
        >
          Mitglied werden
        </button>
      </div>
      {mode !== "password" && !emailEnabled ? (
        <div className="club-notice">
          <h2>Wir bereiten deinen Zugang vor.</h2>
          <p>
            Registrierung und E-Mail-Links öffnen, sobald der Mailversand
            eingerichtet ist. Bestehende Konten können sich mit ihrem Passwort
            anmelden.
          </p>
        </div>
      ) : (
        <ClubForm
          key={mode}
          operation="auth"
          values={{ mode, next }}
          label={
            mode === "password"
              ? "Anmelden"
              : mode === "register"
                ? "Bestätigungslink anfordern"
                : "E-Mail anfordern"
          }
        >
          {mode === "register" && (
            <>
              <div className="club-form-row">
                <label>
                  Vorname
                  <input
                    name="first_name"
                    autoComplete="given-name"
                    maxLength={80}
                    required
                  />
                </label>
                <label>
                  Nachname
                  <input
                    name="last_name"
                    autoComplete="family-name"
                    maxLength={80}
                    required
                  />
                </label>
              </div>
              <label>
                Telefonnummer <span>(optional)</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                />
              </label>
            </>
          )}
          <label>
            E-Mail-Adresse
            <input
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          </label>
          {mode === "password" && (
            <label>
              Passwort
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                minLength={12}
                maxLength={128}
                required
              />
            </label>
          )}
          {mode === "register" && (
            <>
              <label className="club-check">
                <input name="terms" type="checkbox" required />
                <span>
                  Ich habe die{" "}
                  <Link href="/agb">Hinweise zur Kontonutzung</Link> und den{" "}
                  <Link href="/datenschutz">Datenschutz</Link> gelesen.
                </span>
              </label>
              <label className="club-check">
                <input name="newsletter" type="checkbox" />
                <span>
                  Ich möchte freiwillig Neuigkeiten per E-Mail erhalten.
                  Jederzeit abmeldbar.
                </span>
              </label>
              <p className="club-small">
                Du erhältst einen persönlichen Link zur Bestätigung deiner
                E-Mail-Adresse. Ein Passwort ist dafür nicht nötig.
              </p>
            </>
          )}
        </ClubForm>
      )}
      <div className="club-inline-links">
        <button type="button" onClick={() => setMode("link")}>
          Mit E-Mail-Link anmelden
        </button>
        <button type="button" onClick={() => setMode("reset")}>
          Passwort vergessen?
        </button>
      </div>
    </>
  );
}
