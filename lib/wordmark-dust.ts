// Tiny particles sampled along the actual wordmark's outline, not a video asset.
export function startWordmarkDust(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  const label = canvas.parentElement?.querySelector<HTMLElement>(".hero__wordmark");
  if (!context || !label || !window.IntersectionObserver || !window.ResizeObserver) return () => {};
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let width = 0;
  let height = 0;
  let particles: { x: number; y: number; angle: number; size: number }[] = [];
  let frame = 0;
  let visible = false;
  let lastFrame = 0;
  let phase = 0;
  let disposed = false;
  let mobile = window.matchMedia("(max-width: 760px)").matches;
  // The larger highlight background travels left to right, returning outside
  // the letters between loops. The underlying metallic fill stays stationary.
  const shine = label.animate?.([
    { backgroundPosition: "120% 0%, 0% 0%" },
    { backgroundPosition: "-20% 0%, 0% 0%" },
  ], { duration: 6200, iterations: Infinity, easing: "linear" });
  if (shine) { label.dataset.shimmer = "true"; shine.pause(); }
  const sample = () => {
    if (disposed) return;
    mobile = window.matchMedia("(max-width: 760px)").matches;
    const rect = canvas.getBoundingClientRect();
    const type = getComputedStyle(label);
    width = rect.width;
    height = rect.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const mask = document.createElement("canvas");
    mask.width = Math.ceil(width);
    mask.height = Math.ceil(height);
    const ink = mask.getContext("2d", { willReadFrequently: true });
    if (!ink) return;
    ink.font = `${type.fontWeight} ${type.fontSize} ${type.fontFamily}`;
    ink.textBaseline = "middle";
    ink.strokeStyle = "white";
    ink.lineWidth = 1.2;
    const text = label.textContent || "LACACCINO";
    const spacing = parseFloat(type.letterSpacing) || 0;
    const textWidth = ink.measureText(text).width + spacing * (text.length - 1);
    let x = (width - textWidth) / 2;
    for (const character of text) {
      ink.strokeText(character, x, height / 2 + parseFloat(type.fontSize) * .04);
      x += ink.measureText(character).width + spacing;
    }
    const pixels = ink.getImageData(0, 0, mask.width, mask.height).data;
    const edges: { x: number; y: number }[] = [];
    for (let y = 0; y < mask.height; y += 2) {
      for (let x = 0; x < mask.width; x += 2) {
        if (pixels[(y * mask.width + x) * 4 + 3] > 30) edges.push({ x, y });
      }
    }
    particles = Array.from({ length: Math.min(edges.length, mobile ? 160 : 440) }, () => {
      const edge = edges[Math.floor(Math.random() * edges.length)];
      return { ...edge, angle: Math.random() * Math.PI * 2, size: .2 + Math.random() * .45 };
    });
  };
  const draw = (now: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden || preference.matches) return;
    frame = requestAnimationFrame(draw);
    if (lastFrame && now - lastFrame < (mobile ? 48 : 32)) return;
    phase += Math.min(now - (lastFrame || now), 60) / 1000;
    lastFrame = now;
    context.clearRect(0, 0, width, height);
    for (const particle of particles) {
      const angle = particle.angle + phase * .7;
      const orbit = 4.5 + Math.sin(phase * .35 + particle.angle) * 3;
      const x = particle.x + Math.cos(angle) * orbit + Math.sin(phase * .55 + particle.angle) * 4;
      const y = particle.y + Math.sin(angle) * orbit;
      context.globalAlpha = .25 + (.5 + Math.sin(angle) * .5) * .45;
      context.fillStyle = "#dbc19a";
      context.beginPath();
      context.arc(x, y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
  };
  const sync = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastFrame = 0;
    if (!disposed && visible && !document.hidden && !preference.matches) {
      frame = requestAnimationFrame(draw);
      shine?.play();
    } else shine?.pause();
  };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
  const resize = new ResizeObserver(() => {
    try { sample(); } catch { dispose(); }
  });
  const dispose = () => {
    disposed = true;
    cancelAnimationFrame(frame);
    shine?.cancel();
    delete label.dataset.shimmer;
    observer.disconnect();
    resize.disconnect();
    context.clearRect(0, 0, width, height);
    document.removeEventListener("visibilitychange", sync);
  };
  try { sample(); } catch { dispose(); return dispose; }
  observer.observe(canvas);
  resize.observe(canvas);
  document.addEventListener("visibilitychange", sync);
  // Match the actual loaded typeface rather than keeping a fallback-font mask.
  void document.fonts?.ready.then(() => {
    if (!disposed) { try { sample(); } catch { dispose(); } }
  });
  return dispose;
}
