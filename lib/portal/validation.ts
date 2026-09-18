export function customerFields(form: FormData) {
  const read = (key: string) =>
    typeof form.get(key) === "string" ? String(form.get(key)).trim() : "";
  const first_name = read("first_name"),
    last_name = read("last_name"),
    phone = read("phone");
  if (
    !first_name ||
    first_name.length > 80 ||
    !last_name ||
    last_name.length > 80
  )
    return {
      error:
        "Bitte gib Vor- und Nachname mit jeweils höchstens 80 Zeichen ein.",
    };
  if (
    phone &&
    (!/^[+0-9()\s./-]{5,40}$/.test(phone) ||
      phone.replace(/\D/g, "").length < 5)
  )
    return { error: "Bitte prüfe die Telefonnummer oder lasse das Feld leer." };
  return { first_name, last_name, phone, display_name: first_name };
}
export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
export function pointsInput(form: FormData) {
  const userId = String(form.get("user_id") || ""),
    requestKey = String(form.get("request_key") || "");
  const raw = String(form.get("amount") || "");
  const reason = String(form.get("reason") || "").trim();
  const amount = Number(raw);
  if (
    !isUuid(userId) ||
    !isUuid(requestKey) ||
    !/^-?\d+$/.test(raw) ||
    !Number.isSafeInteger(amount) ||
    !amount ||
    Math.abs(amount) > 1000000 ||
    reason.length < 3 ||
    reason.length > 200
  )
    return {
      error:
        "Bitte eine ganze Punktzahl und einen Grund mit 3 bis 200 Zeichen eingeben.",
    };
  return { userId, requestKey, amount, reason };
}
