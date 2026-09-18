export const orderStatuses: Record<string, string> = {
  pending: "Zahlung offen",
  paid: "Bezahlt",
  shipped: "Versendet",
  completed: "Abgeschlossen",
  cancelled: "Storniert",
  refunded: "Erstattet",
};
export const euro = (cents: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
export function accountPage(value?: string) {
  return Math.min(2000, Math.max(0, Number.parseInt(value || "0", 10) || 0));
}
