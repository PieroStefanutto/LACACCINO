import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import {
  ArrowUpRight,
  Coffee,
  CreditCard,
  Gift,
  MapPin,
  Newspaper,
  ShieldCheck,
} from "lucide-react";
import { ClubShell, ClubMark } from "@/components/club/ClubShell";
import { ClubForm } from "@/components/club/ClubForm";
import { StaffDesk } from "@/components/club/StaffDesk";
import { AdminDesk } from "@/components/club/AdminDesk";
import { LocationMap } from "@/components/club/LocationMap";
import { clubData, clubRpc } from "@/lib/club/server";
import { clubMode, commerceModules } from "@/lib/club/config";
import { cardPayload, walletReadiness } from "@/lib/club/wallet";
import type { ClubSnapshot, AdminSnapshot } from "@/lib/club/types";

export const dynamic = "force-dynamic";
const date = (value: string) =>
  new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeZone: "Europe/Berlin",
  }).format(new Date(value));
const points = (value: number) => new Intl.NumberFormat("de-DE").format(value);
function Heading({
  overline,
  title,
  text,
}: {
  overline: string;
  title: string;
  text?: string;
}) {
  return (
    <header className="club-heading">
      <p className="club-overline">{overline}</p>
      <h1>{title}</h1>
      {text && <p>{text}</p>}
    </header>
  );
}
function Empty({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="club-empty">
      <h3>{title}</h3>
      <p>{text}</p>
      {href && (
        <Link className="club-text-link" href={href}>
          {label}
          <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}
function LocationName({ data, id }: { data: ClubSnapshot; id: string | null }) {
  return (
    <>
      {id
        ? data.locations.find((l) => l.id === id)?.name ||
          "Standort derzeit nicht verfügbar"
        : "Alle teilnehmenden geöffneten Standorte"}
    </>
  );
}
function MembershipCard({ data, qr }: { data: ClubSnapshot; qr?: string }) {
  const m = data.member!;
  return (
    <div className={"club-member-card" + (qr ? " club-member-card--full" : "")}>
      <div className="club-card-arches" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <div className="club-card-top">
        <span>
          LACACCINO<small>CLUB MEMBER</small>
        </span>
        <ClubMark />
      </div>
      <div className="club-card-owner">
        <p>
          {data.profile?.first_name} {data.profile?.last_name}
        </p>
        <span>{m.member_number}</span>
      </div>
      <div className="club-card-bottom">
        <span>MITGLIED SEIT {date(m.joined_at)}</span>
        <span>{m.status === "active" ? "MEMBER" : "INAKTIV"}</span>
      </div>
      {qr && m.status === "active" && (
        <div className="club-card-qr">
          <Image
            src={qr}
            width={208}
            height={208}
            unoptimized
            alt={"Mitgliedskarten-QR für " + m.member_number}
          />
          <p>Bei deinem Besuch vorzeigen.</p>
        </div>
      )}
    </div>
  );
}
function History({ data }: { data: ClubSnapshot }) {
  const labels: Record<string, string> = {
    award: "Vergabe",
    redemption: "Prämie",
    correction: "Korrektur",
    reversal: "Storno",
  };
  return (
    <section className="club-panel">
      <div className="club-section-heading">
        <h2>Deine Punkte im Blick.</h2>
        <span>Letzte 100 Buchungen</span>
      </div>
      {!data.entries.length ? (
        <Empty
          title="Dein erster Moment wartet."
          text="Noch keine Punkte gebucht. Sobald das Treueprogramm an einem bestätigten Standort startet, sammelst du mit deiner Karte."
          href="/club/karte"
          label="Meine Karte öffnen"
        />
      ) : (
        <ul className="club-history">
          {data.entries.map((e) => (
            <li key={e.id}>
              <div>
                <strong>{e.reason}</strong>
                <span>
                  {labels[e.kind]} · {date(e.created_at)}
                </span>
              </div>
              <b className={e.amount > 0 ? "is-positive" : ""}>
                {e.amount > 0 ? "+" : ""}
                {points(e.amount)}
              </b>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function ClubPage({
  params,
}: {
  params: Promise<{ section?: string[] }>;
}) {
  const path = (await params).section || [];
  const section = path[0] || "start";
  if (
    path.length > 1 ||
    ![
      "start",
      "karte",
      "vorteile",
      "profil",
      "getraenke",
      "standorte",
      "neuigkeiten",
      "nachrichten",
      "team",
      "admin",
      "zukunft",
    ].includes(section)
  )
    notFound();
  const data = await clubData(
    "/club" + (section === "start" ? "" : "/" + section),
  );
  const demo = clubMode() === "demo";
  if (
    data.initial_password === "/admin/passwort" ||
    data.initial_password === "/mitarbeiter/passwort"
  )
    redirect(data.initial_password);
  const isStaff = ["employee", "manager", "administrator"].includes(data.role);
  const title = data.profile?.first_name || "bei LACACCINO";
  const wrapper = (children: React.ReactNode) => (
    <ClubShell
      demo={demo}
      preview={!demo && process.env.APP_ENV === "preview"}
      role={data.role}
      unread={data.notifications.filter((n) => !n.read_at).length}
    >
      {children}
    </ClubShell>
  );
  if (section === "admin") {
    if (data.role !== "administrator")
      return wrapper(
        <Empty
          title="Dieser Bereich ist geschützt."
          text="Die Administration ist nur mit einem berechtigten Administratorkonto zugänglich."
        />,
      );
    const admin = await clubRpc<AdminSnapshot>("club_admin_snapshot");
    return wrapper(
      <>
        <Heading
          overline="Administration"
          title="Alles an seinem Platz."
          text="Mitglieder, Sortiment, Standorte und das Club-Programm verwalten."
        />
        <AdminDesk data={admin} />
      </>,
    );
  }
  if (section === "team" || (isStaff && section === "start"))
    return wrapper(
      <>
        <Heading
          overline="LACACCINO Service"
          title={"Willkommen, " + title + "."}
          text="Karten prüfen, Punkte buchen und Prämien ausgeben."
        />
        <div className="club-inline-links">
          {data.role === "administrator" && (
            <Link className="club-button club-button--quiet" href="/club/admin">
              Club-Administration
            </Link>
          )}
          {!demo && (
            <Link className="club-text-link" href="/mitarbeiter">
              Zeiterfassung & Abwesenheiten
            </Link>
          )}
        </div>
        {isStaff ? (
          <StaffDesk
            locations={data.work_locations}
            management={data.role !== "employee"}
          />
        ) : (
          <Empty
            title="Servicezugang erforderlich."
            text="Ein Kundenkonto hat keine Berechtigung zur Punktevergabe."
          />
        )}
      </>,
    );
  if (!data.member && isStaff)
    return wrapper(
      <Empty
        title="Dein Zugang gehört zum Team."
        text="Kundenkarten werden über separate Kundenkonten geführt."
        href="/club/team"
        label="Zum Servicebereich"
      />,
    );
  if (!data.member)
    return wrapper(
      <>
        <Heading
          overline="LACACCINO CLUB"
          title="Dein Platz im Club."
          text="Deine persönliche Karte verbindet deine Besuche, Punkte und Lieblingsgetränke."
        />
        <section className="club-panel">
          <h2>Mitgliedskarte einrichten</h2>
          <p>
            Dein bestätigtes Konto erhält eine eigene Mitgliedsnummer. Es werden
            keine Startpunkte, Prämien oder Käufe erfunden.
          </p>
          <ClubForm operation="join" label="Meine Mitgliedskarte erstellen" />
        </section>
      </>,
    );
  if (data.member.status !== "active")
    return wrapper(
      <>
        <Heading
          overline="Mitgliedschaft"
          title="Deine Karte ist derzeit inaktiv."
        />
        <p>
          Du kannst deinen Kontostand ansehen und deine Daten exportieren. Für
          eine Klärung kontaktiere uns bitte.
        </p>
        <Link className="club-button" href="/kontakt">
          Kontakt aufnehmen
        </Link>
        <a className="club-text-link" href="/api/club/export" download>
          Meine Daten herunterladen
        </a>
        {data.newsletter && (
          <ClubForm
            operation="newsletter"
            label="Newsletter abmelden"
            values={{ newsletter: false }}
          />
        )}
        {!data.deletion && (
          <ClubForm
            operation="delete-request"
            label="Kontolöschung anfragen"
            values={{ confirmation: "LÖSCHEN" }}
            confirm="Möchtest du die Löschung deines Kundenkontos anfragen?"
          />
        )}
        <History data={data} />
      </>,
    );
  if (section === "start") {
    const nextReward =
      data.rewards.find((r) => r.points > data.balance) || data.rewards[0];
    return wrapper(
      <>
        <Heading
          overline="Schön, dass du da bist"
          title={"Dein Moment, " + title + "."}
          text="Ein kleiner Überblick. Ein direkter Weg zu deinem nächsten Kaffee."
        />
        <div className="club-dashboard">
          <Link
            className="club-card-link"
            href="/club/karte"
            aria-label="Meine Mitgliedskarte mit QR-Code öffnen"
          >
            <MembershipCard data={data} />
            <span>
              Karte vorzeigen <ArrowUpRight size={18} />
            </span>
          </Link>
          <section className="club-points-panel">
            <div className="club-section-heading">
              <p className="club-overline">Deine Treuepunkte</p>
              <Gift size={23} />
            </div>
            <p className="club-number">
              {points(data.balance)}
              <small>Punkte</small>
            </p>
            {nextReward ? (
              <>
                <div className="club-progress">
                  <span
                    style={{
                      width:
                        Math.min(
                          100,
                          (data.balance / nextReward.points) * 100,
                        ) + "%",
                    }}
                  />
                </div>
                <p>
                  {data.balance >= nextReward.points
                    ? "Eine Prämie ist für dich erreichbar."
                    : "Noch " +
                      points(nextReward.points - data.balance) +
                      " Punkte bis „" +
                      nextReward.title +
                      "“."}
                </p>
              </>
            ) : (
              <p>
                Dein Punktekonto ist bereit. Die Prämien werden hier angezeigt,
                sobald das Programm feststeht.
              </p>
            )}
            <Link className="club-text-link" href="/club/vorteile">
              Vorteile entdecken <ArrowUpRight size={17} />
            </Link>
          </section>
        </div>
        <div className="club-quick-links">
          {[
            {
              href: "/club/getraenke",
              icon: Coffee,
              title: "Dein Lieblingsmoment",
              text:
                data.favourites[0]?.nickname || "Lieblingsgetränk speichern",
            },
            {
              href: "/club/standorte",
              icon: MapPin,
              title: "In deiner Nähe",
              text: "Standorte & Zukunftsvisionen",
            },
            {
              href: "/club/neuigkeiten",
              icon: Newspaper,
              title: "Aus unserer Welt",
              text: "Journal & Events",
            },
          ].map(({ href, icon: Icon, title, text }) => (
            <Link key={href} href={href}>
              <Icon size={23} />
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
        <div className="club-columns">
          <section className="club-panel club-editorial">
            <p className="club-overline">Aus dem Club</p>
            {data.content[0] ? (
              <>
                <h2>{data.content[0].title}</h2>
                <p>{data.content[0].body}</p>
                <Link className="club-text-link" href="/club/neuigkeiten">
                  Im Journal lesen <ArrowUpRight size={17} />
                </Link>
              </>
            ) : (
              <Empty
                title="Raum für Neues."
                text="Hier findest du künftig bestätigte Neuigkeiten, Aktionen und Veranstaltungen."
              />
            )}
          </section>
          <section className="club-panel">
            <p className="club-overline">Deine Vorteile</p>
            <h2>Es beginnt mit einem Moment.</h2>
            <p>
              {data.redemptions.filter((r) => r.status === "reserved").length
                ? "Deine reservierten Prämien warten auf die Ausgabe am teilnehmenden Standort."
                : "Alle verfügbaren Prämien, ihre Bedingungen und dein Punktestand an einem Ort."}
            </p>
            <Link
              className="club-button club-button--quiet"
              href="/club/vorteile"
            >
              Meine Vorteile ansehen
            </Link>
          </section>
        </div>
        <History data={data} />
      </>,
    );
  }
  if (section === "karte") {
    const qr = await QRCode.toDataURL(
      cardPayload(data.member.card_identifier),
      {
        width: 416,
        margin: 4,
        errorCorrectionLevel: "M",
        color: { dark: "#18120eff", light: "#ffffffff" },
      },
    );
    return wrapper(
      <>
        <Heading
          overline="Deine Mitgliedschaft"
          title="Einfach vorzeigen."
          text="Deine persönliche Karte. Bei jedem Besuch griffbereit."
        />
        <div className="club-card-layout">
          <MembershipCard data={data} qr={qr} />
          <div>
            <section className="club-panel">
              <ShieldCheck size={25} />
              <h2>Dein Moment bleibt persönlich.</h2>
              <p>
                Der QR-Code enthält nur eine zufällige Kartenkennung. Er gibt
                weder deine E-Mail-Adresse noch Zugang zu deinem Konto weiter.
              </p>
              <p className="club-small">
                Die Karte bestätigt keinen Kauf. Punktevergabe und
                Prämienausgabe erfordern zusätzlich eine berechtigte
                Mitarbeiteraktion.
              </p>
            </section>
            <section className="club-panel">
              <h2>Auch unterwegs griffbereit.</h2>
              {walletReadiness().map((w) => (
                <div key={w.provider} className="club-wallet-state">
                  <CreditCard size={22} />
                  <div>
                    <h3>{w.provider}</h3>
                    <p>{w.label}</p>
                    <small>{w.detail}</small>
                  </div>
                </div>
              ))}
              <p className="club-small">
                Hinzufügen-Schaltflächen erscheinen erst nach Einrichtung und
                Prüfung der jeweiligen Wallet.
              </p>
            </section>
          </div>
        </div>
      </>,
    );
  }
  if (section === "vorteile")
    return wrapper(
      <>
        <Heading
          overline="Punkte & Prämien"
          title="Mehr aus deinem Moment."
          text={"Dein verfügbarer Punktestand: " + points(data.balance) + "."}
        />
        <div className="club-grid">
          {data.rewards.map((r) => (
            <section className="club-panel" key={r.id}>
              <Gift size={25} />
              <p className="club-overline">
                Treueprämie · {points(r.points)} Punkte
              </p>
              <h2>{r.title}</h2>
              <p>{r.description}</p>
              <details className="club-conditions">
                <summary>Bedingungen & Gültigkeit</summary>
                <p>{r.conditions}</p>
                <p>
                  <LocationName data={data} id={r.location_id} />
                </p>
                <p>
                  Ab {date(r.starts_at)}
                  {r.ends_at
                    ? " bis " + date(r.ends_at)
                    : " · kein Enddatum festgelegt"}
                </p>
              </details>
              {data.balance >= r.points ? (
                <ClubForm
                  operation="reserve"
                  label="Prämie reservieren"
                  values={{ reward_id: r.id }}
                  confirm={
                    r.points +
                    " Punkte für „" +
                    r.title +
                    "“ einlösen? Die Ausgabe bestätigt später das Personal."
                  }
                />
              ) : (
                <p className="club-small">
                  Noch {points(r.points - data.balance)} Punkte bis zu dieser
                  Prämie.
                </p>
              )}
            </section>
          ))}
        </div>
        {!data.rewards.length && (
          <Empty
            title="Deine Vorteile entstehen."
            text="Es sind noch keine Treueprämien freigegeben. Hier erscheinen nur tatsächlich verfügbare Angebote."
          />
        )}
        <section className="club-panel">
          <h2>Meine Prämien</h2>
          {!data.redemptions.length ? (
            <p>Du hast noch keine Prämie reserviert oder eingelöst.</p>
          ) : (
            data.redemptions.map((r) => (
              <div className="club-list-item" key={r.id}>
                <span className="club-pill">
                  {r.status === "reserved"
                    ? "Reserviert"
                    : r.status === "fulfilled"
                      ? "Ausgegeben"
                      : "Storniert"}
                </span>
                <h3>{r.title}</h3>
                <p>{r.conditions}</p>
                <p className="club-small">
                  {date(r.created_at)} · {r.points} Punkte
                </p>
                {r.status === "reserved" && (
                  <ClubForm
                    operation="finish-reward"
                    values={{ id: r.id, cancel: true }}
                    label="Reservierung stornieren"
                    confirm="Prämie stornieren und die Punkte zurückbuchen?"
                  />
                )}
              </div>
            ))
          )}
        </section>
        <section className="club-panel">
          <h2>Rabattaktionen & Geschenkgutscheine</h2>
          <p>
            Die vorhandenen Rabattcodes für den späteren Shop bleiben im
            bisherigen Kundenkonto. Sie sind von Treueprämien getrennt. Gekaufte
            Geschenkgutscheine gibt es noch nicht.
          </p>
          {!demo && (
            <Link className="club-text-link" href="/konto/rabattcodes">
              Meine Shop-Rabattcodes
            </Link>
          )}
          <Link className="club-text-link" href="/club/zukunft">
            Was wir vorbereiten <ArrowUpRight size={17} />
          </Link>
        </section>
        <History data={data} />
      </>,
    );
  if (section === "getraenke")
    return wrapper(
      <>
        <Heading
          overline="Lieblingsgetränke"
          title="So magst du deinen Kaffee."
          text="Speichere deine Vorlieben für den nächsten Besuch. Ein Lieblingsgetränk ist noch keine Bestellung."
        />
        <div className="club-columns">
          <section className="club-panel">
            <h2>Ein neues Lieblingsgetränk</h2>
            {!data.variants.length ? (
              <Empty
                title="Das Sortiment entsteht."
                text="Sobald bestätigte Getränke und Optionen vorliegen, kannst du deine Favoriten zusammenstellen."
              />
            ) : (
              <ClubForm
                operation="favourite"
                label="Lieblingsgetränk speichern"
              >
                <label>
                  Dein Name dafür
                  <input
                    name="nickname"
                    required
                    maxLength={60}
                    placeholder="Mein Morgen"
                  />
                </label>
                <label>
                  Verfügbare Getränkekombination
                  <select name="variant_id" required>
                    {data.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {[v.drink, v.size, v.temperature, v.milk, v.extras]
                          .filter(Boolean)
                          .join(" · ")}
                      </option>
                    ))}
                  </select>
                </label>
              </ClubForm>
            )}
          </section>
          <section className="club-panel">
            <h2>Deine gespeicherten Momente</h2>
            {!data.favourites.length ? (
              <Empty
                title="Noch ganz nach deinem Geschmack."
                text="Wähle eine verfügbare Kombination und gib deinem Lieblingsgetränk einen eigenen Namen."
              />
            ) : (
              data.favourites.map((f) => (
                <article className="club-list-item" key={f.id}>
                  <h3>{f.nickname}</h3>
                  <p>
                    {[f.drink, f.size, f.temperature, f.milk, f.extras]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {!f.available && (
                    <p className="club-notice">
                      Diese Kombination ist aktuell nicht mehr verfügbar. Deine
                      Präferenz bleibt gespeichert.
                    </p>
                  )}
                  <details className="club-editor">
                    <summary>Bearbeiten</summary>
                    <ClubForm operation="favourite" values={{ id: f.id }}>
                      <label>
                        Name
                        <input
                          name="nickname"
                          defaultValue={f.nickname}
                          required
                          maxLength={60}
                        />
                      </label>
                      <label>
                        Kombination
                        <select
                          name="variant_id"
                          defaultValue={f.available ? f.variant_id : ""}
                          required
                        >
                          {!f.available && (
                            <option value="">Neue Kombination wählen</option>
                          )}
                          {data.variants.map((v) => (
                            <option key={v.id} value={v.id}>
                              {[
                                v.drink,
                                v.size,
                                v.temperature,
                                v.milk,
                                v.extras,
                              ].join(" · ")}
                            </option>
                          ))}
                        </select>
                      </label>
                    </ClubForm>
                  </details>
                  <ClubForm
                    operation="remove-favourite"
                    label="Entfernen"
                    values={{ id: f.id }}
                    confirm="Dieses Lieblingsgetränk entfernen?"
                  />
                </article>
              ))
            )}
          </section>
        </div>
        {!demo && (
          <Link className="club-text-link" href="/konto/lieblingsprodukte">
            Bereits bestellte Lieblingsprodukte
          </Link>
        )}
      </>,
    );
  if (section === "profil")
    return wrapper(
      <>
        <Heading
          overline="Dein Profil"
          title="Ganz nach deinem Geschmack."
          text="Deine Angaben und Einstellungen. Du entscheidest, was du mit uns teilst."
        />
        <div className="club-columns">
          <section className="club-panel">
            <h2>Persönliche Angaben</h2>
            <ClubForm operation="profile">
              <div className="club-form-row">
                <label>
                  Vorname
                  <input
                    name="first_name"
                    defaultValue={data.profile?.first_name}
                    autoComplete="given-name"
                    maxLength={80}
                    required
                  />
                </label>
                <label>
                  Nachname
                  <input
                    name="last_name"
                    defaultValue={data.profile?.last_name}
                    autoComplete="family-name"
                    maxLength={80}
                    required
                  />
                </label>
              </div>
              <label>
                E-Mail-Adresse
                <input
                  type="email"
                  value={data.profile?.email || ""}
                  readOnly
                  aria-describedby="club-email-note"
                />
              </label>
              <p className="club-small" id="club-email-note">
                Bestätigte Anmeldeadresse. Eine sichere Änderung mit erneuter
                Bestätigung ist noch vorzubereiten.
              </p>
              <label>
                Telefonnummer (optional)
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                  defaultValue={data.profile?.phone}
                />
              </label>
              <label>
                Bevorzugter Standort
                <select
                  name="preferred_location"
                  defaultValue={data.member.preferred_location || ""}
                >
                  <option value="">Noch keine Auswahl</option>
                  {data.locations
                    .filter((l) => l.status === "open")
                    .map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                </select>
              </label>
              <label className="club-check">
                <input
                  type="checkbox"
                  name="order_notifications"
                  defaultChecked={data.member.order_notifications}
                />
                <span>
                  Zusätzliche Bestellbenachrichtigungen erhalten, sobald
                  Bestellungen angeboten werden.
                </span>
              </label>
              <label className="club-check">
                <input
                  type="checkbox"
                  name="newsletter"
                  defaultChecked={data.newsletter}
                />
                <span>
                  Freiwillige Neuigkeiten per E-Mail erhalten. Jederzeit hier
                  abmeldbar. Einwilligung und Widerruf werden mit Zeitpunkt und
                  Textversion gespeichert.
                </span>
              </label>
              <p className="club-small">
                Notwendige Kontonachrichten bleiben im Portal sichtbar.
                E-Mail-Versand ist noch nicht eingerichtet.
              </p>
            </ClubForm>
          </section>
          <div>
            <section className="club-panel">
              <h2>Deine Daten gehören dir.</h2>
              <p>
                Lade deine Profilangaben, Einwilligungen, Buchungen und mit
                deinem Konto verknüpfte Daten als JSON herunter.
              </p>
              <a
                className="club-button club-button--quiet"
                href="/api/club/export"
                download
              >
                Meine Daten exportieren
              </a>
            </section>
            <section className="club-panel">
              <h2>Konto löschen lassen</h2>
              {data.deletion ? (
                <p role="status">
                  Deine Anfrage vom {date(data.deletion.created_at)} ist{" "}
                  {data.deletion.status === "processing"
                    ? "in Bearbeitung"
                    : "eingegangen"}
                  . Dein Konto ist noch nicht gelöscht.
                </p>
              ) : (
                <>
                  <p>
                    Wir prüfen deinen Löschungswunsch und gegebenenfalls
                    aufzubewahrende Geschäftsdaten. Die Anfrage ist keine
                    sofortige Löschung.
                  </p>
                  <ClubForm
                    operation="delete-request"
                    label="Kontolöschung anfragen"
                    confirm="Möchtest du die Löschung deines Kundenkontos anfragen?"
                  >
                    <label>
                      Zur Bestätigung LÖSCHEN eingeben
                      <input
                        name="confirmation"
                        required
                        pattern="LÖSCHEN"
                        autoComplete="off"
                      />
                    </label>
                  </ClubForm>
                </>
              )}
            </section>
            <Link className="club-text-link" href="/club/nachrichten">
              Nachrichten & Kontoinformationen
            </Link>
            <Link className="club-text-link" href="/club/standorte">
              Standorte entdecken
            </Link>
            {!demo && (
              <Link className="club-text-link" href="/konto/bestellungen">
                Bestellhistorie
              </Link>
            )}
          </div>
        </div>
      </>,
    );
  if (section === "standorte") {
    const open = data.locations.filter(
      (l) => l.status === "open" && l.confirmed,
    );
    return wrapper(
      <>
        <Heading
          overline="Orte für deinen Moment"
          title="Wo wir dich begrüßen."
          text="Hier stehen ausschließlich bestätigte, geöffnete Standorte. Unsere Zukunftsvisionen findest du getrennt darunter."
        />
        {!open.length && (
          <Empty
            title="Unsere ersten Orte entstehen."
            text="Noch ist kein geöffnetes Café bestätigt. Es sind keine Standortbestellungen möglich."
          />
        )}
        <LocationMap locations={open} />
        <div className="club-grid">
          {open.map((l) => (
            <article className="club-panel" key={l.id} id={"location-" + l.id}>
              <MapPin size={25} />
              <h2>{l.name}</h2>
              <p>{l.address}</p>
              <h3>Öffnungszeiten</h3>
              <p className="club-preline">
                {l.hours || "Noch nicht hinterlegt"}
              </p>
              {l.exceptions && <p>Abweichungen: {l.exceptions}</p>}
              <p>{l.amenities}</p>
              <p>{l.contact}</p>
              <a
                className="club-text-link"
                target="_blank"
                rel="noopener noreferrer"
                href={
                  "https://www.openstreetmap.org/?mlat=" +
                  encodeURIComponent(String(l.latitude)) +
                  "&mlon=" +
                  encodeURIComponent(String(l.longitude)) +
                  "#map=17/" +
                  l.latitude +
                  "/" +
                  l.longitude
                }
              >
                Karte & Anfahrt öffnen <ArrowUpRight size={16} />
              </a>
            </article>
          ))}
        </div>
        <section className="club-panel">
          <p className="club-overline">
            Zukunftsvisionen · keine geöffneten Cafés
          </p>
          <h2>Wir denken weiter.</h2>
          <p>
            {data.locations
              .filter((l) => l.status === "vision")
              .map((l) => l.name)
              .join(" · ") ||
              "Stuttgart · Hamburg · Mallorca · Bangkok · London · Dubai"}
          </p>
          <p className="club-small">
            Diese Orte sind nicht als Café-Eröffnung bestätigt. Keine
            Öffnungszeiten, Reservierungen oder Bestellungen.
          </p>
        </section>
      </>,
    );
  }
  if (section === "neuigkeiten")
    return wrapper(
      <>
        <Heading
          overline="Das Club-Journal"
          title="Was uns gerade bewegt."
          text="Neuigkeiten, Aktionen und bestätigte Veranstaltungen."
        />
        <div className="club-grid">
          {data.content.map((c) => (
            <article className="club-panel" key={c.id}>
              {c.image_path && (
                <Image
                  className="club-content-image"
                  src={c.image_path}
                  alt=""
                  width={800}
                  height={500}
                />
              )}
              <p className="club-overline">
                {c.kind === "event"
                  ? "Veranstaltung"
                  : c.kind === "promotion"
                    ? "Aktion"
                    : "Journal"}
              </p>
              <h2>{c.title}</h2>
              <p className="club-preline">{c.body}</p>
              <p className="club-small">
                <LocationName data={data} id={c.location_id} />
                {c.ends_at && " · Bis " + date(c.ends_at)}
              </p>
              {c.kind === "event" && (
                <>
                  <p className="club-small">
                    {c.capacity
                      ? c.capacity + " Plätze insgesamt"
                      : "Keine Kapazitätsgrenze hinterlegt"}{" "}
                    · Verfügbarkeit wird bei der Anmeldung geprüft.
                  </p>
                  <ClubForm
                    operation="event"
                    values={{ id: c.id, joining: !data.events.includes(c.id) }}
                    label={
                      data.events.includes(c.id)
                        ? "Anmeldung zurücknehmen"
                        : "Zum Event anmelden"
                    }
                  />
                </>
              )}
            </article>
          ))}
        </div>
        {!data.content.length && (
          <Empty
            title="Bald gibt es mehr zu erzählen."
            text="Derzeit sind keine Neuigkeiten oder Veranstaltungen veröffentlicht."
          />
        )}
      </>,
    );
  if (section === "nachrichten")
    return wrapper(
      <>
        <Heading
          overline="Dein Postfach"
          title="Alles Wichtige an einem Ort."
          text="Kontonachrichten, spätere Bestellinfos und freiwillige Marketingnachrichten bleiben klar getrennt."
        />
        {!data.notifications.length ? (
          <Empty
            title="Alles auf dem aktuellen Stand."
            text="Du hast noch keine Nachrichten. Änderungen an deinem Punktekonto erscheinen künftig hier."
          />
        ) : (
          <section className="club-panel">
            {data.notifications.map((n) => (
              <article className="club-list-item" key={n.id}>
                <p className="club-overline">
                  {n.category === "account"
                    ? "Konto"
                    : n.category === "order"
                      ? "Bestellung"
                      : "Marketing"}{" "}
                  · {date(n.created_at)}
                </p>
                <h2>{n.title}</h2>
                <p>{n.body}</p>
                {!n.read_at ? (
                  <ClubForm
                    operation="read"
                    label="Als gelesen markieren"
                    values={{ id: n.id }}
                  />
                ) : (
                  <span className="club-small">Gelesen</span>
                )}
              </article>
            ))}
          </section>
        )}
        <Link className="club-text-link" href="/club/profil">
          Benachrichtigungen einstellen
        </Link>
      </>,
    );
  return wrapper(
    <>
      <Heading
        overline="Was wir vorbereiten"
        title="Der nächste Schritt. Mit Bedacht."
        text="Der Club verkauft derzeit nichts. Diese Module werden erst nach ausdrücklicher Freigabe aktiviert."
      />
      <div className="club-grid">
        {commerceModules.map((m) => (
          <section className="club-panel" key={m.name}>
            <span className="club-pill">{m.state}</span>
            <h2>{m.name}</h2>
            <p>{m.missing}</p>
          </section>
        ))}
      </div>
    </>,
  );
}
