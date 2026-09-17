"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { reducedMotionQuery } from "@/lib/motion";

const sessionKey = "lacaccino:intro:seen";

/** Optional decoration: the complete page is rendered independently underneath. */
export function CoffeeStorm() {
  const layer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const dismiss = useRef<() => void>(() => {});

  useEffect(() => {
    const element = layer.current;
    const surface = canvas.current;
    const preference = window.matchMedia(reducedMotionQuery);
    if (!element || !surface || preference.matches || document.hidden || window.scrollY > 30 || window.location.hash) return;

    try {
      // If session storage is unavailable, do not risk replaying the introduction.
      if (sessionStorage.getItem(sessionKey)) return;
    } catch { return; }

    let disposed = false;
    let stopDrawing: (() => void) | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      disposed = true;
      element.hidden = true;
      stopDrawing?.();
      clearTimeout(importDeadline);
      clearTimeout(watchdog);
      // Never leave keyboard focus inside a removed decorative layer.
      if (element.contains(document.activeElement)) {
        document.getElementById("discover")?.focus({ preventScroll: true });
      }
    };
    dismiss.current = finish;
    const onVisibility = () => { if (document.hidden) finish(); };
    const onMotion = () => { if (preference.matches) finish(); };
    const onInteraction = () => finish();
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !element.contains(event.target)) finish();
    };
    const onKey = (event: KeyboardEvent) => {
      if (["Tab", "Escape", "ArrowDown", "PageDown", " "].includes(event.key)) finish();
    };

    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onInteraction, { once: true, passive: true });
    document.addEventListener("focusin", onFocus);
    window.addEventListener("scroll", onInteraction, { once: true, passive: true });
    preference.addEventListener("change", onMotion);
    const importDeadline = setTimeout(finish, 1400);

    void import("@/lib/coffee-storm").then(({ startStorm }) => {
      if (disposed || preference.matches || document.hidden) return;
      clearTimeout(importDeadline);
      try {
        const context = surface.getContext("2d", { alpha: false });
        if (!context) { finish(); return; }
        sessionStorage.setItem(sessionKey, "1");
        stopDrawing = startStorm(surface, context, element, finish);
        if (disposed) { stopDrawing(); return; }
        element.hidden = false;
        // A separate deadline also clears the layer if rendering ever stalls.
        watchdog = setTimeout(finish, 5800);
      } catch { finish(); }
    }).catch(finish);

    return () => {
      finish();
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onInteraction);
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("scroll", onInteraction);
      preference.removeEventListener("change", onMotion);
    };
  }, []);

  return (
    <div ref={layer} className="coffee-storm" hidden>
      <canvas ref={canvas} className="coffee-storm__canvas" aria-hidden="true" />
      <div className="coffee-storm__signature" aria-hidden="true">
        <span className="eyebrow">Aus einem goldenen Kaffeesturm geboren</span>
        <span className="coffee-storm__wordmark">LACACCINO</span>
        <span className="coffee-storm__caption">Ein Moment. Ganz deiner.</span>
      </div>
      <button className="intro-skip" type="button" onClick={() => dismiss.current()}>
        Intro überspringen <ArrowUpRight size={16} aria-hidden="true" />
      </button>
      <div className="coffee-storm__timeline" aria-hidden="true"><span /></div>
    </div>
  );
}
