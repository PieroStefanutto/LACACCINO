import {
  dateLabel,
  timeLabel,
  hours,
  euro,
  netSeconds,
  statusLabel,
  type TimeEntry,
  type Absence,
} from "@/lib/staff/model";
import {
  AbsenceReviewForm,
  CancelAbsenceForm,
  VoidTimeForm,
} from "./StaffForms";
export function TimeHistory({
  entries,
  admin = false,
}: {
  entries: TimeEntry[];
  admin?: boolean;
}) {
  if (!entries.length)
    return (
      <p className="portal-empty">
        Für diesen Zeitraum sind noch keine Arbeitszeiten erfasst.
      </p>
    );
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <caption>Arbeitszeiten · Europe/Berlin</caption>
        <thead>
          <tr>
            <th>Datum / Beginn</th>
            <th>Ende</th>
            <th>Pause</th>
            <th>Arbeitszeit</th>
            <th>Brutto-Schätzung</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className={entry.voided ? "staff-voided" : ""}>
              <td>
                {dateLabel(entry.started_at)}
                <span>{timeLabel(entry.started_at)}</span>
              </td>
              <td>
                {entry.ended_at ? (
                  <>
                    {dateLabel(entry.ended_at)}
                    <span>{timeLabel(entry.ended_at)}</span>
                  </>
                ) : (
                  "Läuft"
                )}
              </td>
              <td>
                {Math.floor(entry.break_seconds / 60)} Min.
                {entry.break_started_at ? " + laufende Pause" : ""}
              </td>
              <td>
                {entry.ended_at ? hours(netSeconds(entry, 0)) : "Live oben"}
              </td>
              <td>
                {entry.ended_at
                  ? euro((netSeconds(entry, 0) / 3600) * entry.hourly_cents)
                  : "Live oben"}
                <span>{euro(entry.hourly_cents)} / Std.</span>
              </td>
              <td>
                {entry.voided
                  ? "Storniert"
                  : entry.source === "manual"
                    ? "Nachgetragen"
                    : "Stempeluhr"}
                {entry.note && <span>{entry.note}</span>}
                {admin && !entry.voided && (
                  <details>
                    <summary>Korrigieren</summary>
                    <VoidTimeForm id={entry.id} memberId={entry.user_id} />
                  </details>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function AbsenceHistory({
  requests,
  admin = false,
  names,
}: {
  requests: Absence[];
  admin?: boolean;
  names?: Record<string, string>;
}) {
  if (!requests.length)
    return (
      <p className="portal-empty">Noch keine Meldungen in diesem Zeitraum.</p>
    );
  return (
    <div className="staff-requests">
      {requests.map((request) => (
        <article key={request.id} className="staff-request">
          <div className="staff-request__heading">
            <div>
              <p className="eyebrow">
                {names?.[request.user_id] ||
                  (request.kind === "sick" ? "Krankmeldung" : "Urlaubsantrag")}
              </p>
              <h3>
                {dateLabel(request.starts_on)} – {dateLabel(request.ends_on)}
              </h3>
              <p>
                {request.kind === "vacation"
                  ? `Urlaub · ${request.days} Tage`
                  : "Krankmeldung"}{" "}
                · Eingereicht {dateLabel(request.created_at)}
              </p>
            </div>
            <span className={`portal-badge staff-badge--${request.status}`}>
              {statusLabel(request)}
            </span>
          </div>
          {request.response && (
            <p className="staff-response">Rückmeldung: {request.response}</p>
          )}
          {request.status === "pending" &&
            (admin ? (
              <details>
                <summary>Meldung bearbeiten</summary>
                <AbsenceReviewForm request={request} />
              </details>
            ) : (
              <CancelAbsenceForm id={request.id} />
            ))}
        </article>
      ))}
    </div>
  );
}
