import { formatDate, formatPoints } from "@/lib/portal/server";
export type PointsEntry = {
  id: string;
  amount: number;
  reason: string;
  created_at: string;
};
export function PointsHistory({ entries }: { entries: PointsEntry[] }) {
  if (!entries.length)
    return (
      <div className="portal-empty">
        <span aria-hidden="true">◇</span>
        <h3>Hier beginnt deine Geschichte.</h3>
        <p>
          Sobald Punkte gutgeschrieben werden, findest du jede Buchung hier.
        </p>
      </div>
    );
  return (
    <ul className="points-history">
      {entries.map((entry) => (
        <li key={entry.id}>
          <div>
            <strong>{entry.reason}</strong>
            <time dateTime={entry.created_at}>
              {formatDate(entry.created_at)}
            </time>
          </div>
          <span className={entry.amount > 0 ? "points-positive" : ""}>
            {entry.amount > 0 ? "+" : ""}
            {formatPoints(entry.amount)} <small>Punkte</small>
          </span>
        </li>
      ))}
    </ul>
  );
}
