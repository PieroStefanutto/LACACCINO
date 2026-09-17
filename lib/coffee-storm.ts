// Loaded only when the optional introduction can actually play.
// Canvas 2D, stylised beans and projected dust; no video or 3D engine.
const duration = 5400;
const tau = Math.PI * 2;
const smooth = (value: number) => {
  const bounded = Math.max(0, Math.min(1, value));
  return bounded * bounded * (3 - 2 * bounded);
};

export function startStorm(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  layer: HTMLElement,
  onComplete: () => void,
) {
  const mobile = window.matchMedia("(max-width: 760px)").matches;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.scale(pixelRatio, pixelRatio);
  const signature = layer.querySelector<HTMLElement>(".coffee-storm__signature");
  const timeline = layer.querySelector<HTMLElement>(".coffee-storm__timeline span");
  const centerX = width / 2;
  const centerY = height * 0.5;
  const reach = Math.hypot(width, height) * 0.55;
  // Stable seeded particles, no per-frame allocation of sprites or gradients.
  let seed = 73;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const particles = Array.from({ length: mobile ? 90 : 210 }, (_, index) => ({
    angle: random() * tau,
    depth: random(),
    radius: 0.15 + random() * 0.85,
    size: 0.5 + random() * 1.1,
    bean: index % 17 === 0,
    turn: random() * tau,
    warmth: random() > 0.58,
  }));
  const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, reach);
  glow.addColorStop(0, "#302217");
  glow.addColorStop(0.35, "#18110d");
  glow.addColorStop(1, "#080706");
  const metallic = context.createLinearGradient(-12, -10, 12, 10);
  metallic.addColorStop(0, "#2c1b10");
  metallic.addColorStop(0.33, "#795737");
  metallic.addColorStop(0.5, "#ddc393");
  metallic.addColorStop(0.61, "#604329");
  metallic.addColorStop(1, "#21140c");
  let frameId = 0;
  let cancelled = false;
  let started: number | undefined;
  let previous = 0;

  const draw = (now: number) => {
    if (cancelled) return;
    if (document.hidden) { onComplete(); return; }
    started ??= now;
    const elapsed = now - started;
    if (elapsed >= duration) { onComplete(); return; }
    frameId = requestAnimationFrame(draw);
    // Smaller screens are capped at 30 fps and a lower backing resolution.
    if (previous && now - previous < (mobile ? 32 : 15)) return;
    previous = now;
    try {
      const progress = elapsed / duration;
      const energy = smooth(progress / 0.65);
      const opening = smooth((progress - 0.64) / 0.36);
      context.globalAlpha = 1;
      context.fillStyle = glow;
      context.fillRect(0, 0, width, height);

      // Continuous, shallow ribbon arcs echo the packaging's fine wave motif.
      context.save();
      context.translate(centerX, centerY);
      context.rotate(-0.13 + progress * 0.15);
      for (let line = 0; line < (mobile ? 5 : 8); line++) {
        const spread = (line - 3) * 26;
        const shift = Math.sin(progress * 2.5 + line * 0.18) * height * 0.14;
        context.beginPath();
        context.moveTo(-width, height * 0.23 + spread);
        context.bezierCurveTo(-width * 0.28, -height * 0.4 + shift + spread, width * 0.22, height * 0.46 + spread, width, -height * 0.17 + spread);
        context.globalAlpha = (0.05 + energy * 0.23) * (1 - opening * 0.6);
        context.strokeStyle = line === 3 ? "#e5cfaa" : "#92714b";
        context.lineWidth = line === 3 ? 1.1 : 0.6;
        context.stroke();
      }
      context.restore();

      for (const particle of particles) {
        const angle = particle.angle + progress * (0.24 + energy * 1.4);
        const depth = 0.3 + particle.depth * 0.7;
        const radius = particle.radius * reach * (0.36 + depth * 0.62 + energy * 0.25 + opening * 1.6);
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius * 0.68;
        const alpha = (0.15 + depth * 0.45) * smooth((progress + particle.depth * 0.12) / 0.3);
        context.globalAlpha = alpha;
        if (particle.bean) {
          context.save();
          context.translate(x, y);
          context.rotate(particle.turn + progress * 1.2);
          const scale = (0.45 + depth * 0.7) * (1 + energy * 0.6);
          context.scale(scale, scale);
          context.fillStyle = metallic;
          context.beginPath();
          context.ellipse(0, 0, 7, 11, 0.3, 0, tau);
          context.fill();
          context.beginPath();
          context.moveTo(-2, -9);
          context.bezierCurveTo(4, -3, -4, 4, 2, 9);
          context.strokeStyle = "#1d120b";
          context.lineWidth = 1.4;
          context.stroke();
          context.restore();
        } else {
          context.fillStyle = particle.warmth ? "#b58a58" : "#d7c19c";
          context.beginPath();
          context.arc(x, y, particle.size * (0.45 + depth + energy * 0.6), 0, tau);
          context.fill();
        }
      }
      context.globalAlpha = 1;
      if (signature) {
        signature.style.opacity = String(smooth((progress - 0.3) / 0.3));
        signature.style.transform = `translateY(${12 * (1 - energy)}px) scale(${0.97 + energy * 0.03})`;
      }
      if (timeline) timeline.style.transform = `scaleX(${progress})`;
      layer.style.opacity = String(1 - smooth((progress - 0.83) / 0.17));
    } catch { onComplete(); }
  };

  // Draw a first frame before the caller reveals the layer.
  draw(performance.now());
  return () => { cancelled = true; cancelAnimationFrame(frameId); };
}
