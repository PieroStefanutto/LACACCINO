export const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
export const cinematicEase = "cubic-bezier(.22,.68,.25,1)";

/** A finite reveal. Base styles are always readable if JS never runs. */
export function reveal(element: Element, delay = 0) {
  return element.animate(
    [{ opacity: 0.25, transform: "translateY(22px)" }, { opacity: 1, transform: "translateY(0)" }],
    { duration: 1000, delay, easing: cinematicEase },
  );
}
