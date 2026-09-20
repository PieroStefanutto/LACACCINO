"use client";
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export async function sendClub(
  operation: string,
  values: Record<string, unknown>,
) {
  const response = await fetch(`/api/club/${operation}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      data.error || "Das hat nicht geklappt. Bitte erneut versuchen.",
    );
  return data;
}

export function ClubForm({
  operation,
  children,
  label = "Speichern",
  values = {},
  confirm,
  className = "",
  refresh = true,
  onResult,
}: {
  operation: string;
  children?: ReactNode;
  label?: string;
  values?: Record<string, unknown>;
  confirm?: string;
  className?: string;
  refresh?: boolean;
  onResult?: (data: Record<string, unknown>) => void;
}) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const requestId = useRef<string | null>(null);
  const locked = useRef(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || (confirm && !window.confirm(confirm))) return;
    locked.current = true;
    setPending(true);
    setFeedback(null);
    requestId.current ??= crypto.randomUUID();
    const form = new FormData(event.currentTarget);
    const fields = Object.fromEntries(form.entries());
    for (const field of Array.from(
      event.currentTarget.querySelectorAll<HTMLInputElement>(
        'input[type="datetime-local"]',
      ),
    )) {
      if (field.value)
        fields[field.name] = new Date(field.value + "Z").toISOString();
    }
    try {
      const data = await sendClub(operation, {
        ...values,
        ...fields,
        request_id: requestId.current,
      });
      requestId.current = null;
      setFeedback({ ok: true, text: data.message || "Gespeichert." });
      onResult?.(data);
      if (data.redirect) router.push(data.redirect);
      if (refresh) router.refresh();
    } catch (error) {
      setFeedback({
        ok: false,
        text:
          error instanceof Error ? error.message : "Bitte erneut versuchen.",
      });
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  return (
    <form className={`club-form ${className}`} onSubmit={submit}>
      <fieldset disabled={pending}>
        {children}
        <button className="club-button" type="submit" disabled={pending}>
          {pending ? "Wird verarbeitet …" : label}
        </button>
      </fieldset>
      {feedback && (
        <p
          className={`club-feedback ${feedback.ok ? "is-success" : "is-error"}`}
          role={feedback.ok ? "status" : "alert"}
        >
          {feedback.text}
        </p>
      )}
    </form>
  );
}
