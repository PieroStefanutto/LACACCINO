"use client";

import { useEffect, useRef } from "react";
import { reducedMotionQuery } from "@/lib/motion";

export function WordmarkDust() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = canvas.current;
    const preference = window.matchMedia(reducedMotionQuery);
    if (!element || preference.matches) return;
    let disposed = false;
    let cancel: (() => void) | undefined;
    void import("@/lib/wordmark-dust").then(({ startWordmarkDust }) => {
      if (!disposed && !preference.matches) cancel = startWordmarkDust(element);
    }).catch(() => { /* Plain metallic typography is the complete fallback. */ });
    const onPreference = () => { if (preference.matches) { disposed = true; cancel?.(); } };
    preference.addEventListener("change", onPreference);
    return () => { disposed = true; cancel?.(); preference.removeEventListener("change", onPreference); };
  }, []);
  return <canvas ref={canvas} className="wordmark-dust" aria-hidden="true" />;
}

export function GoldSparkle() {
  const sparkle = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = sparkle.current;
    if (!element || !element.animate) return;
    const preference = window.matchMedia(reducedMotionQuery);
    let timer: ReturnType<typeof setInterval> | undefined;
    let animation: Animation | undefined;
    let lastX = 0;
    const stop = () => { clearInterval(timer); animation?.cancel(); element.hidden = true; };
    const glint = () => {
      if (document.hidden || preference.matches || document.querySelector(".coffee-storm:not([hidden])")) return;
      let x = 8 + Math.random() * 84;
      if (Math.abs(x - lastX) < 18) x = x > 50 ? x - 28 : x + 28;
      lastX = x;
      element.style.left = `${x}%`;
      element.style.top = `${15 + Math.random() * 72}%`;
      element.hidden = false;
      // One small, slow glint. Never a full-screen flash or a strobe.
      animation = element.animate([
        { opacity: 0, transform: "scale(.35) rotate(0deg)", offset: 0 },
        { opacity: .8, transform: "scale(1) rotate(12deg)", offset: .5 },
        { opacity: 0, transform: "scale(.35) rotate(24deg)", offset: 1 },
      ], { duration: 1700, easing: "ease-in-out" });
      animation.addEventListener("finish", () => { element.hidden = true; }, { once: true });
    };
    const configure = () => {
      stop();
      if (!preference.matches && !document.hidden) timer = setInterval(glint, 5000);
    };
    configure();
    preference.addEventListener("change", configure);
    document.addEventListener("visibilitychange", configure);
    return () => { stop(); preference.removeEventListener("change", configure); document.removeEventListener("visibilitychange", configure); };
  }, []);
  return <span ref={sparkle} className="gold-spark" aria-hidden="true" hidden />;
}
