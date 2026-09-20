"use client";
import { useState } from "react";
import Link from "next/link";
import type { AdminSnapshot, AdminRecord } from "@/lib/club/types";
import { ClubForm } from "./ClubForm";

type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  choices?: { value: string; label: string }[];
  max?: number;
};
function Editor({
  entity,
  fields,
  record,
  title,
}: {
  entity: string;
  fields: Field[];
  record?: AdminRecord;
  title: string;
}) {
  return (
    <details className="club-editor">
      <summary>{title}</summary>
      <ClubForm
        operation="admin"
        values={{ entity, id: record?.id || "" }}
        label="Änderungen speichern"
      >
        {fields.map((f) => {
          const value = record?.[f.key];
          if (f.type === "checkbox")
            return (
              <label className="club-check" key={f.key}>
                <input
                  type="checkbox"
                  name={f.key}
                  defaultChecked={value === true}
                />
                <span>{f.label}</span>
              </label>
            );
          return (
            <label key={f.key}>
              {f.label}
              {f.choices ? (
                <select
                  name={f.key}
                  defaultValue={String(value ?? "")}
                  required={f.required}
                >
                  {!f.required && (
                    <option value="">Alle / nicht zugeordnet</option>
                  )}
                  {f.choices.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  name={f.key}
                  rows={4}
                  defaultValue={String(value ?? "")}
                  required={f.required}
                  maxLength={f.max || 2000}
                />
              ) : (
                <input
                  name={f.key}
                  type={f.type || "text"}
                  required={f.required}
                  maxLength={f.max || 300}
                  defaultValue={
                    f.type === "datetime-local" && value
                      ? new Date(String(value)).toISOString().slice(0, 16)
                      : String(value ?? "")
                  }
                  step={f.type === "number" ? "any" : undefined}
                />
              )}
            </label>
          );
        })}
        <p className="club-small">
          Nur bestätigte Angaben veröffentlichen. Alle Änderungen werden
          protokolliert.
        </p>
      </ClubForm>
    </details>
  );
}

export function AdminDesk({ data }: { data: AdminSnapshot }) {
  const [tab, setTab] = useState("members");
  const locations = data.locations.map((x) => ({
    value: String(x.id),
    label: String(x.name),
  }));
  const schemas: Record<
    string,
    { entity: string; title: string; fields: Field[]; records: AdminRecord[] }
  > = {
    locations: {
      entity: "location",
      title: "Standort",
      records: data.locations,
      fields: [
        { key: "name", label: "Name", required: true },
        {
          key: "status",
          label: "Status",
          required: true,
          choices: [
            { value: "draft", label: "Entwurf" },
            { value: "vision", label: "Zukunftsvision" },
            { value: "open", label: "Geöffnet" },
          ],
        },
        {
          key: "confirmed",
          label: "Dieser Standort ist tatsächlich bestätigt",
          type: "checkbox",
        },
        { key: "address", label: "Vollständige Adresse" },
        { key: "latitude", label: "Breitengrad", type: "number" },
        { key: "longitude", label: "Längengrad", type: "number" },
        {
          key: "hours",
          label: "Reguläre Öffnungszeiten",
          type: "textarea",
          max: 1000,
        },
        {
          key: "exceptions",
          label: "Abweichende Öffnungszeiten",
          type: "textarea",
          max: 1000,
        },
        { key: "amenities", label: "Ausstattung", max: 500 },
        { key: "contact", label: "Kontakt", max: 200 },
      ],
    },
    drinks: {
      entity: "drink",
      title: "Getränk",
      records: data.drinks,
      fields: [
        { key: "name", label: "Getränkename", required: true, max: 100 },
        {
          key: "description",
          label: "Beschreibung",
          type: "textarea",
          max: 500,
        },
        { key: "active", label: "Im Sortiment verfügbar", type: "checkbox" },
      ],
    },
    variants: {
      entity: "variant",
      title: "Gültige Kombination",
      records: data.variants,
      fields: [
        {
          key: "drink_id",
          label: "Getränk",
          required: true,
          choices: data.drinks.map((x) => ({
            value: String(x.id),
            label: String(x.name),
          })),
        },
        { key: "size", label: "Größe", required: true, max: 40 },
        { key: "temperature", label: "Temperatur", required: true, max: 40 },
        {
          key: "milk",
          label: "Milch / Alternative / Ohne",
          required: true,
          max: 60,
        },
        { key: "extras", label: "Extras", max: 100 },
        {
          key: "active",
          label: "Diese Kombination verfügbar machen",
          type: "checkbox",
        },
      ],
    },
    rules: {
      entity: "rule",
      title: "Punkteregel",
      records: data.rules,
      fields: [
        {
          key: "location_id",
          label: "Standort",
          required: true,
          choices: locations,
        },
        { key: "title", label: "Regelbezeichnung", required: true, max: 100 },
        {
          key: "cents_per_point",
          label: "Umsatz in Cent pro Punkt",
          type: "number",
          required: true,
        },
        {
          key: "conditions",
          label: "Bedingungen und Berechnungsgrundlage",
          type: "textarea",
          required: true,
        },
        {
          key: "active",
          label: "Diese wirtschaftlich geprüfte Regel freigeben",
          type: "checkbox",
        },
      ],
    },
    rewards: {
      entity: "reward",
      title: "Treueprämie",
      records: data.rewards,
      fields: [
        { key: "title", label: "Prämie", required: true, max: 100 },
        {
          key: "description",
          label: "Beschreibung",
          type: "textarea",
          max: 1000,
        },
        {
          key: "points",
          label: "Benötigte Punkte",
          type: "number",
          required: true,
        },
        {
          key: "conditions",
          label: "Verbindliche Bedingungen",
          type: "textarea",
          required: true,
        },
        {
          key: "location_id",
          label: "Teilnehmender Standort (leer = alle)",
          choices: locations,
        },
        {
          key: "starts_at",
          label: "Verfügbar ab (UTC)",
          type: "datetime-local",
        },
        {
          key: "ends_at",
          label: "Gültig bis (UTC, optional)",
          type: "datetime-local",
        },
        { key: "active", label: "Prämie freigeben", type: "checkbox" },
      ],
    },
    content: {
      entity: "content",
      title: "Inhalt",
      records: data.content,
      fields: [
        {
          key: "kind",
          label: "Art",
          required: true,
          choices: [
            { value: "news", label: "Neuigkeit" },
            { value: "event", label: "Event" },
            { value: "promotion", label: "Aktion (Information)" },
          ],
        },
        { key: "title", label: "Titel", required: true, max: 120 },
        {
          key: "body",
          label: "Text und Bedingungen",
          type: "textarea",
          required: true,
          max: 4000,
        },
        { key: "image_path", label: "Vorhandenes Bild (/images/…)" },
        { key: "location_id", label: "Standortbezug", choices: locations },
        {
          key: "starts_at",
          label: "Sichtbar / Anmeldung ab (UTC)",
          type: "datetime-local",
        },
        {
          key: "ends_at",
          label: "Sichtbar / Anmeldung bis (UTC)",
          type: "datetime-local",
        },
        {
          key: "capacity",
          label: "Eventplätze (leer = unbegrenzt)",
          type: "number",
        },
        { key: "published", label: "Veröffentlichen", type: "checkbox" },
      ],
    },
  };
  const section = schemas[tab];
  return (
    <>
      <div className="club-metrics">
        <div>
          <strong>{data.metrics.active_members}</strong>
          <span>Aktive Mitgliedschaften · aktueller Stand</span>
        </div>
        <div>
          <strong>{data.metrics.awarded_30_days}</strong>
          <span>Vergebene Punkte · letzte 30 Tage</span>
        </div>
        <div>
          <strong>{data.metrics.fulfilled_30_days}</strong>
          <span>Ausgegebene Prämien · letzte 30 Tage</span>
        </div>
      </div>
      <p className="club-small">
        Zeitraum: {new Date(data.metrics.since).toLocaleDateString("de-DE")} –{" "}
        {new Date(data.metrics.until).toLocaleDateString("de-DE")}. Punkte
        zählen Vergaben vor Korrekturen. Prämien zählen bestätigte Ausgaben.
      </p>
      <div
        className="club-tabs club-tabs--wrap"
        role="group"
        aria-label="Verwaltungsbereiche"
      >
        {Object.entries({
          members: "Mitglieder",
          locations: "Standorte",
          drinks: "Sortiment",
          variants: "Kombinationen",
          rules: "Punkteregeln",
          rewards: "Prämien",
          content: "Journal & Events",
          staff: "Team & Rechte",
          deletions:
            "Löschanfragen (" +
            data.deletions.filter((d) => d.status === "pending").length +
            ")",
          audit: "Protokoll",
        }).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="club-panel">
        {section && (
          <>
            <h2>{section.title} verwalten</h2>
            <Editor
              key={tab + ":new"}
              entity={section.entity}
              fields={section.fields}
              title={"+ " + section.title + " anlegen"}
            />
            {section.records.map((record) => (
              <Editor
                key={tab + ":" + record.id}
                entity={section.entity}
                fields={section.fields}
                record={record}
                title={String(
                  record.title ||
                    record.name ||
                    [record.size, record.temperature, record.milk].join(" · "),
                )}
              />
            ))}
            {!section.records.length && (
              <p>Noch keine Einträge. Neue Inhalte beginnen als Entwurf.</p>
            )}
          </>
        )}
        {tab === "members" && (
          <>
            <h2>Mitglieder</h2>
            <p>
              Die letzten 200 Mitgliedschaften. Gesperrte Karten können keine
              neuen Buchungen auslösen.
            </p>
            {!data.members.length && <p>Noch keine Mitglieder.</p>}
            {data.members.map((m) => (
              <div className="club-list-item" key={String(m.id)}>
                <h3>
                  {m.first_name} {m.last_name}
                </h3>
                <p>
                  {m.member_number} · {m.status}
                </p>
                {m.status !== "closed" && (
                  <ClubForm
                    operation="admin"
                    label={
                      m.status === "active"
                        ? "Mitgliedschaft sperren"
                        : "Mitgliedschaft freigeben"
                    }
                    values={{
                      entity: "member",
                      id: m.id,
                      status: m.status === "active" ? "suspended" : "active",
                    }}
                    confirm="Mitgliedsstatus ändern? Die Änderung wird protokolliert."
                  />
                )}
              </div>
            ))}
          </>
        )}
        {tab === "staff" && (
          <>
            <h2>Standortrechte</h2>
            <p>
              Mitarbeiterkonten werden über die bestehende Personalverwaltung
              eingerichtet. Hier vergibst du Club-Rechte.
            </p>
            <Link className="club-text-link" href="/admin/mitarbeiter">
              Bestehende Personalverwaltung
            </Link>
            <Editor
              entity="staff_role"
              title="Standortrecht zuweisen oder entziehen"
              fields={[
                {
                  key: "user_id",
                  label: "Mitarbeiter",
                  required: true,
                  choices: data.staff.map((s) => ({
                    value: String(s.user_id),
                    label: String(s.name),
                  })),
                },
                {
                  key: "location_id",
                  label: "Standort",
                  required: true,
                  choices: locations,
                },
                {
                  key: "role",
                  label: "Rolle",
                  required: true,
                  choices: [
                    {
                      value: "employee",
                      label: "Mitarbeiter: Belege & Ausgabe",
                    },
                    {
                      value: "manager",
                      label: "Standortleitung: zusätzlich Korrekturen",
                    },
                    { value: "none", label: "Recht entziehen" },
                  ],
                },
              ]}
            />
            {data.roles.map((r, i) => (
              <p key={i}>
                {data.staff.find((s) => s.user_id === r.user_id)?.name} ·{" "}
                {data.locations.find((l) => l.id === r.location_id)?.name} ·{" "}
                {r.role}
              </p>
            ))}
          </>
        )}
        {tab === "deletions" && (
          <>
            <h2>Löschungsanfragen</h2>
            <p>
              Aufbewahrung und abhängige Daten müssen geprüft werden. „In
              Bearbeitung“ löscht kein Konto. Die endgültige Löschung mit
              Wallet-Sperrung ist vor Echtbetrieb noch abzunehmen.
            </p>
            {!data.deletions.length && <p>Keine offenen Anfragen.</p>}
            {data.deletions.map((d) => (
              <div className="club-list-item" key={String(d.id)}>
                <p>
                  {d.member_number} · {d.status} ·{" "}
                  {new Date(String(d.created_at)).toLocaleDateString("de-DE")}
                </p>
                {d.status === "pending" && (
                  <ClubForm
                    operation="admin"
                    label="Bearbeitung übernehmen"
                    values={{
                      entity: "deletion",
                      id: d.id,
                      status: "processing",
                    }}
                  />
                )}
              </div>
            ))}
          </>
        )}
        {tab === "audit" && (
          <>
            <h2>Aktionsprotokoll</h2>
            <p className="club-small">
              Letzte 100 Einträge. Keine Passwörter, Tokens oder E-Mail-Adressen
              im Protokoll.
            </p>
            <div className="club-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Zeit</th>
                    <th>Aktion</th>
                    <th>Bearbeiter</th>
                    <th>Referenz</th>
                  </tr>
                </thead>
                <tbody>
                  {data.audit.map((a) => (
                    <tr key={String(a.id)}>
                      <td>
                        {new Date(String(a.created_at)).toLocaleString("de-DE")}
                      </td>
                      <td>{a.operation}</td>
                      <td>
                        <code>{a.actor_id}</code>
                      </td>
                      <td>
                        <code>{a.reference}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
