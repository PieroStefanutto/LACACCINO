"use client";
import Link from "next/link";
export default function ClubError({ reset }: { reset: () => void }) {
  return (
    <main className="club-loading">
      <p className="club-overline">LACACCINO CLUB</p>
      <h1>Ein Moment Pause.</h1>
      <p role="alert">
        Deine Daten konnten gerade nicht geladen werden. Bitte versuche es
        erneut.
      </p>
      <button className="club-button" onClick={reset}>
        Erneut laden
      </button>
      <Link className="club-text-link" href="/">
        Zur Homepage
      </Link>
    </main>
  );
}
