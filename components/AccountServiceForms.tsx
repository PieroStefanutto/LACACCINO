"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  activateCoupon,
  deleteCustomerAccount,
} from "@/app/account-service-actions";
import { emptyState } from "@/lib/community/validation";

export function CouponActivation({
  id,
  activated,
  redeemed,
  code,
}: {
  id: string;
  activated: boolean;
  redeemed: boolean;
  code: string;
}) {
  const [state, action, pending] = useActionState(activateCoupon, emptyState);
  const [copyStatus, setCopyStatus] = useState("");
  return (
    <div className="coupon-action">
      {redeemed ? (
        <p className="portal-badge">Bereits eingelöst</p>
      ) : activated ? (
        <>
          <span className="portal-badge portal-badge--active">
            Aktiviert · für den Shopstart
          </span>
          <label className="coupon-code-label" htmlFor={`code-${id}`}>
            Dein persönlicher Rabattcode
          </label>
          <input
            id={`code-${id}`}
            className="coupon-code"
            value={code}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
          <button
            type="button"
            className="button button--outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopyStatus("Code kopiert.");
              } catch {
                setCopyStatus(
                  "Bitte markiere den Code und kopiere ihn manuell.",
                );
              }
            }}
          >
            Code kopieren
          </button>
          <p className="form-feedback" role="status">
            {copyStatus}
          </p>
        </>
      ) : (
        <form action={action}>
          <input type="hidden" name="coupon_id" value={id} />
          <button type="submit" className="button" disabled={pending}>
            {pending ? "Wird aktiviert …" : "Rabattcode aktivieren"}
          </button>
        </form>
      )}
      <p
        className={`form-feedback${state.ok ? " form-feedback--success" : ""}`}
        role="status"
      >
        {state.message}
      </p>
    </div>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(
    deleteCustomerAccount,
    emptyState,
  );
  return (
    <form action={action} className="community-form">
      <fieldset disabled={pending}>
        <label className="form-check">
          <input type="checkbox" name="understood" value="yes" required />
          <span>
            Ich möchte mein Kundenkonto endgültig löschen. Mein Punktestand und
            meine persönlichen Rabattcodes gehen dabei verloren.
          </span>
        </label>
        <label htmlFor="delete-confirmation">
          Gib zur Bestätigung LÖSCHEN ein
          <input
            id="delete-confirmation"
            name="confirmation"
            autoComplete="off"
            spellCheck={false}
            required
            pattern="LÖSCHEN"
            maxLength={7}
          />
        </label>
        <button className="button button--danger" type="submit">
          {pending ? "Konto wird gelöscht …" : "Mein Konto endgültig löschen"}
        </button>
      </fieldset>
      <p className="form-feedback" role="status">
        {state.message}
      </p>
      <Link className="text-link" href="/konto#sicherheit">
        Abbrechen und Konto behalten
      </Link>
    </form>
  );
}
