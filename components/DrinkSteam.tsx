"use client";

import { useEffect, useId, useRef } from "react";

export function DrinkSteam({ left, top }: { left: number; top: number }) {
  const root = useRef<HTMLDivElement>(null);
  const gradient = useId();

  useEffect(() => {
    const element = root.current;
    if (!element || !window.IntersectionObserver) return;
    let visible = false;
    const update = () => { element.dataset.running = String(visible && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    observer.observe(element);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);

  return (
    <div ref={root} className="drink-steam" style={{ left: `${left}%`, top: `${top}%` }} aria-hidden="true">
      <svg viewBox="0 0 100 160" fill="none" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="160" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f4e8d8" stopOpacity="0" />
            <stop offset=".35" stopColor="#f4e8d8" stopOpacity=".7" />
            <stop offset=".75" stopColor="#f4e8d8" />
            <stop offset="1" stopColor="#f4e8d8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke={`url(#${gradient})`} strokeWidth="5" strokeLinecap="round">
          <path className="drink-steam__wisp" d="M35 157 C17 133 58 115 42 91 S19 56 43 14" />
          <path className="drink-steam__wisp" d="M53 157 C77 128 37 109 53 84 S79 46 58 9" />
          <path className="drink-steam__wisp" d="M68 157 C49 132 82 110 65 86 S48 47 70 17" />
        </g>
      </svg>
    </div>
  );
}
