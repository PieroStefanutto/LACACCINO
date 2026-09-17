export type FormState = { ok: boolean; message: string };

export const emptyState: FormState = { ok: false, message: "" };

export function field(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function validEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value: string): boolean {
  return value.length >= 12 && value.length <= 128;
}

export function validateContact(form: FormData) {
  const name = field(form, "name");
  const email = field(form, "email").toLowerCase();
  const message = field(form, "message");
  if (name.length < 2 || name.length > 100) return { error: "Bitte gib einen Namen mit 2 bis 100 Zeichen ein." };
  if (!validEmail(email)) return { error: "Bitte gib eine gültige E-Mail-Adresse ein." };
  if (message.length < 10 || message.length > 4000) return { error: "Deine Nachricht muss 10 bis 4.000 Zeichen enthalten." };
  if (field(form, "consent") !== "yes") return { error: "Bitte bestätige die Speicherung deiner Anfrage." };
  return { name, email, message };
}

export function callbackDestination(value: string | null) {
  return value === "/konto/passwort" ? value : "/konto";
}
