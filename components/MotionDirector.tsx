"use client";

import { useEffect } from "react";
import { cinematicEase, reducedMotionQuery, reveal } from "@/lib/motion";

/** Progressive enhancement: no hidden-on-load class and no scroll interception. */
export function MotionDirector() {
  useEffect(() => {
    const preference = window.matchMedia(reducedMotionQuery);
    let teardown = () => {};
    const setup = () => {
      teardown();
      if (preference.matches || !window.IntersectionObserver || !Element.prototype.animate) return;

      const animations = new Map<Element, Animation>();
      const visible = new Set<Element>();
      const revealed = new Set<Element>();
      const targets = document.querySelectorAll<HTMLElement>("[data-reveal], [data-line], [data-ambient]");
      const play = (target: HTMLElement) => {
        if (document.hidden || !visible.has(target)) return;
        const existing = animations.get(target);
        if (existing) { if (existing.playState === "paused") existing.play(); return; }
        let animation: Animation;
        if (target.hasAttribute("data-ambient")) {
          animation = target.animate(
            [{ transform: "translateX(-2%)", opacity: 0.35 }, { transform: "translateX(3%)", opacity: 0.65 }],
            { duration: 10000, iterations: Infinity, direction: "alternate", easing: "ease-in-out" },
          );
        } else {
          if (revealed.has(target)) return;
          revealed.add(target);
          const delay = Number(target.dataset.delay || 0);
          animation = target.hasAttribute("data-line")
            ? target.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 1300, delay, easing: cinematicEase })
            : reveal(target, delay);
          animation.addEventListener("finish", () => animations.delete(target), { once: true });
        }
        animations.set(target, animation);
      };
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          if (entry.isIntersecting) { visible.add(target); play(target); }
          else { visible.delete(target); animations.get(target)?.pause(); }
        }
      }, { threshold: 0.08 });
      targets.forEach((target) => observer.observe(target));

      // Event-driven framing for just two photographs, desktop only.
      const frames = window.matchMedia("(min-width: 901px)").matches
        ? [...document.querySelectorAll<HTMLElement>("[data-drift]")] : [];
      const inViewFrames = new Set<HTMLElement>();
      let request = 0;
      const updateFrames = () => {
        request = 0;
        if (document.hidden) return;
        for (const frame of inViewFrames) {
          const rect = frame.getBoundingClientRect();
          const progress = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
          frame.style.setProperty("--image-position", `${46 + progress * 8}%`);
        }
      };
      const onScroll = () => {
        if (!request && !document.hidden && inViewFrames.size) request = requestAnimationFrame(updateFrames);
      };
      const frameObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inViewFrames.add(entry.target as HTMLElement);
          else inViewFrames.delete(entry.target as HTMLElement);
        }
        onScroll();
      });
      frames.forEach((frame) => frameObserver.observe(frame));
      const onVisibility = () => {
        for (const [target, animation] of animations) {
          if (document.hidden || !visible.has(target)) animation.pause();
          else animation.play();
        }
        if (document.hidden) { cancelAnimationFrame(request); request = 0; }
        else { visible.forEach((target) => play(target as HTMLElement)); onScroll(); }
      };
      document.addEventListener("visibilitychange", onVisibility);
      window.addEventListener("scroll", onScroll, { passive: true });
      teardown = () => {
        observer.disconnect();
        frameObserver.disconnect();
        animations.forEach((animation) => animation.cancel());
        cancelAnimationFrame(request);
        frames.forEach((frame) => frame.style.removeProperty("--image-position"));
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("scroll", onScroll);
      };
    };
    setup();
    preference.addEventListener("change", setup);
    return () => { teardown(); preference.removeEventListener("change", setup); };
  }, []);
  return null;
}
