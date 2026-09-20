"use client";
import { useState } from "react";
import Image from "next/image";
import { ClubForm } from "./ClubForm";
export function MfaPanel() {
  const [factor, setFactor] = useState<{ id: string; qr?: string } | null>(
    null,
  );
  return (
    <section className="club-panel">
      <p className="club-overline">Geschützter Zugang</p>
      <h2>Zweiten Faktor bestätigen</h2>
      <p>
        Für Service und Administration benötigst du zusätzlich einen Code deiner
        Authenticator-App.
      </p>
      {!factor ? (
        <ClubForm
          operation="mfa-enroll"
          label="Authenticator einrichten oder bestätigen"
          refresh={false}
          onResult={(data) =>
            setFactor({
              id: String(data.factorId),
              qr: data.qr ? String(data.qr) : undefined,
            })
          }
        />
      ) : (
        <>
          {factor.qr && (
            <>
              <p>
                Scanne diesen Einrichtungscode mit deiner Authenticator-App.
                Halte ihn privat.
              </p>
              {/* Provider-generated QR is displayed as an image, never injected into HTML. */}
              <Image
                width={240}
                height={240}
                unoptimized
                className="club-mfa-qr"
                src={
                  factor.qr.startsWith("data:")
                    ? factor.qr
                    : `data:image/svg+xml,${encodeURIComponent(factor.qr)}`
                }
                alt="QR-Code zum Einrichten des zweiten Faktors"
              />
            </>
          )}
          <ClubForm
            operation="mfa-verify"
            values={{ factor_id: factor.id }}
            label="Code bestätigen"
          >
            <label>
              Sechsstelliger Code
              <input
                name="code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </label>
          </ClubForm>
        </>
      )}
    </section>
  );
}
