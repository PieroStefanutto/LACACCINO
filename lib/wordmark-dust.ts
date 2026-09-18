/** A quiet, wind-driven veil. Work stops outside the viewport or a visible tab. */
export function startWordmarkDust(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context || !window.IntersectionObserver || !window.ResizeObserver)
    return () => {};
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0,
    height = 0,
    frame = 0,
    last = 0,
    phase = 0;
  let visible = false,
    disposed = false;
  let particles: { x: number; y: number; speed: number; size: number }[] = [];
  const mobile = window.matchMedia("(max-width: 700px)").matches;
  const resize = () => {
    ({ width, height } = canvas.getBoundingClientRect());
    const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = Array.from({ length: mobile ? 56 : 128 }, () => ({
      x: Math.random(),
      y: Math.random(),
      speed: 0.012 + Math.random() * 0.021,
      size: 0.35 + Math.random() * 0.65,
    }));
  };
  const draw = (now: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden || preference.matches) return;
    frame = requestAnimationFrame(draw);
    if (last && now - last < (mobile ? 48 : 32)) return;
    phase += Math.min(now - (last || now), 80) / 1000;
    last = now;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#cab184";
    for (const p of particles) {
      const travel = (p.x + phase * p.speed) % 1;
      const x = travel * width;
      const y =
        height *
        (0.64 + p.y * 0.29 - Math.sin(travel * 5 + phase * 0.14) * 0.07);
      context.globalAlpha = Math.sin(travel * Math.PI) * (0.12 + p.y * 0.23);
      context.beginPath();
      context.ellipse(x, y, p.size * 1.7, p.size * 0.6, -0.18, 0, Math.PI * 2);
      context.fill();
    }
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    last = 0;
    if (!disposed && visible && !document.hidden && !preference.matches)
      frame = requestAnimationFrame(draw);
    else context.clearRect(0, 0, width, height);
  };
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  });
  const sizes = new ResizeObserver(resize);
  resize();
  observer.observe(canvas);
  sizes.observe(canvas);
  document.addEventListener("visibilitychange", sync);
  preference.addEventListener("change", sync);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    sizes.disconnect();
    context.clearRect(0, 0, width, height);
    document.removeEventListener("visibilitychange", sync);
    preference.removeEventListener("change", sync);
  };
}
