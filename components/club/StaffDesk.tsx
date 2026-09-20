"use client";
import { useEffect, useRef, useState } from "react";
import type { Location } from "@/lib/club/types";
import { ClubForm } from "./ClubForm";

type Lookup = {
  name: string;
  member_number: string;
  balance: number;
  status: string;
  redemptions: {
    id: string;
    title: string;
    conditions: string;
    expires_at: string | null;
  }[];
};
type Detector = {
  detect: (video: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

function Scanner({ onCode }: { onCode: (value: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const [active, setActive] = useState(false);
  const [message, setMessage] = useState("");
  function stop() {
    running.current = false;
    if (timer.current) clearTimeout(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setActive(false);
  }
  useEffect(
    () => () => {
      running.current = false;
      if (timer.current) clearTimeout(timer.current);
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  async function start() {
    const DetectorClass = (
      window as unknown as {
        BarcodeDetector?: new (options: { formats: string[] }) => Detector;
      }
    ).BarcodeDetector;
    if (!DetectorClass) {
      setMessage(
        "Dieser Browser unterstützt den QR-Scanner nicht. Bitte die Mitgliedsnummer manuell eingeben.",
      );
      return;
    }
    try {
      const detector = new DetectorClass({ formats: ["qr_code"] });
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (!video.current) {
        stop();
        return;
      }
      video.current.srcObject = stream.current;
      await video.current.play();
      running.current = true;
      setActive(true);
      setMessage("Halte die LACACCINO-Karte in den Kamerabereich.");
      const scan = async () => {
        if (!running.current || !video.current) return;
        try {
          const codes = await detector.detect(video.current);
          const code = codes.find((c) =>
            /^LC1:[0-9a-f-]{36}$/i.test(c.rawValue),
          );
          if (code) {
            onCode(code.rawValue);
            stop();
            setMessage(
              "Karte erkannt. Bitte Mitglied aufrufen. Es wurde noch kein Kauf bestätigt.",
            );
            return;
          }
        } catch {
          /* A camera frame may temporarily be unavailable. */
        }
        if (running.current) timer.current = setTimeout(scan, 300);
      };
      void scan();
    } catch {
      stop();
      setMessage(
        "Die Kamera konnte nicht geöffnet werden. Bitte Berechtigung prüfen oder die Mitgliedsnummer eingeben.",
      );
    }
  }
  return (
    <div className="club-scanner">
      <button
        type="button"
        className="club-button club-button--quiet"
        onClick={active ? stop : start}
      >
        {active ? "Kamera schließen" : "QR-Scanner öffnen"}
      </button>
      <video
        ref={video}
        playsInline
        muted
        hidden={!active}
        aria-label="Kamerabild des Mitgliedskarten-Scanners"
      />
      {message && (
        <p role="status" className="club-small">
          {message}
        </p>
      )}
    </div>
  );
}

export function StaffDesk({
  locations,
  management,
}: {
  locations: Location[];
  management: boolean;
}) {
  const [card, setCard] = useState("");
  const [location, setLocation] = useState(locations[0]?.id || "");
  const [member, setMember] = useState<Lookup | null>(null);
  const [kind, setKind] = useState("award");
  if (!locations.length)
    return (
      <div className="club-empty">
        <h2>Noch kein Service-Standort</h2>
        <p>
          Die Administration muss einen bestätigten Standort und die passenden
          Rechte zuweisen.
        </p>
      </div>
    );
  return (
    <div className="club-columns">
      <section className="club-panel">
        <p className="club-overline">01 · Identifizieren</p>
        <h2>Ein Moment am Tresen.</h2>
        <p>
          Eine Karte identifiziert die Mitgliedschaft. Die Buchung bestätigst du
          anhand eines echten Belegs.
        </p>
        <Scanner
          onCode={(value) => {
            setCard(value);
            setMember(null);
          }}
        />
        <ClubForm
          operation="lookup"
          label="Mitglied aufrufen"
          refresh={false}
          onResult={(data) => setMember(data.result as Lookup)}
        >
          <label>
            Dein Standort
            <select
              name="location_id"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setMember(null);
              }}
            >
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mitgliedsnummer oder Kartenkennung
            <input
              name="card"
              autoComplete="off"
              required
              maxLength={80}
              value={card}
              onChange={(e) => {
                setCard(e.target.value);
                setMember(null);
              }}
              placeholder="LC-…"
            />
          </label>
        </ClubForm>
      </section>
      <section className="club-panel">
        <p className="club-overline">02 · Buchen & ausgeben</p>
        {!member ? (
          <>
            <h2>Bereit für die nächste Karte.</h2>
            <p>
              Nach der Suche erscheinen nur Name, Kartenstatus, Punktestand und
              reservierte Prämien.
            </p>
          </>
        ) : (
          <>
            <h2>{member.name}</h2>
            <p className="club-small">
              {member.member_number} ·{" "}
              {member.status === "active"
                ? "Aktiv"
                : "Gesperrt oder geschlossen"}
            </p>
            <p className="club-number">
              {member.balance}
              <small>Punkte</small>
            </p>
            {member.status === "active" && (
              <>
                <ClubForm
                  key={`${member.member_number}:${location}:${kind}`}
                  operation="book"
                  label="Buchung bestätigen"
                  values={{
                    card: member.member_number,
                    location_id: location,
                    kind,
                  }}
                  confirm="Sind Beleg, Betrag und Standort geprüft? Diese Buchung wird protokolliert."
                  onResult={(data) =>
                    setMember({ ...member, balance: Number(data.result) })
                  }
                >
                  {management && (
                    <label>
                      Vorgang
                      <select
                        value={kind}
                        onChange={(e) => setKind(e.target.value)}
                      >
                        <option value="award">
                          Punkte für einen Beleg vergeben
                        </option>
                        <option value="correction">
                          Punktestand korrigieren
                        </option>
                        <option value="reversal">
                          Frühere Buchung stornieren
                        </option>
                      </select>
                    </label>
                  )}
                  <label>
                    {kind === "award"
                      ? "Belegbetrag in Cent (500 = 5 €)"
                      : kind === "reversal"
                        ? "Kontrollwert (0 bei Storno)"
                        : "Punkteänderung (auch negativ)"}
                    <input
                      type="number"
                      name="amount"
                      step="1"
                      required
                      min={kind === "award" ? 1 : undefined}
                      max={100000000}
                      defaultValue={kind === "reversal" ? 0 : undefined}
                    />
                  </label>
                  {kind === "reversal" && (
                    <label>
                      ID der ursprünglichen Buchung
                      <input
                        name="original_entry"
                        required
                        placeholder="UUID aus dem Buchungsprotokoll"
                      />
                    </label>
                  )}
                  <label>
                    Beleg- oder Vorgangsreferenz
                    <input
                      name="reference"
                      minLength={3}
                      maxLength={100}
                      required
                      autoComplete="off"
                    />
                  </label>
                  <label>
                    Grund
                    <input
                      name="reason"
                      minLength={3}
                      maxLength={200}
                      required
                      placeholder={
                        kind === "award"
                          ? "Kaffeebeleg geprüft"
                          : "Grund der Korrektur"
                      }
                    />
                  </label>
                  <p className="club-small">
                    Punkte werden anhand der freigegebenen Standortregel
                    berechnet. Ohne Regel ist keine Vergabe möglich.
                  </p>
                </ClubForm>
                {member.redemptions.map((r) => (
                  <div className="club-list-item" key={r.id}>
                    <h3>{r.title}</h3>
                    <p>{r.conditions}</p>
                    <ClubForm
                      operation="finish-reward"
                      label="Prämie als ausgegeben bestätigen"
                      values={{ id: r.id, location_id: location }}
                      confirm="Wird die Prämie jetzt an dieses Mitglied ausgegeben?"
                      onResult={() =>
                        setMember({
                          ...member,
                          redemptions: member.redemptions.filter(
                            (x) => x.id !== r.id,
                          ),
                        })
                      }
                    />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
