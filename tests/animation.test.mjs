import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

// Isolated renderer tests: no browser or DOM simulator is needed.
const source = readFileSync(new URL("../lib/coffee-storm.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;

function scene({ mobile = false, failDrawing = false } = {}) {
  const scheduled = new Map();
  let nextFrame = 1;
  let completions = 0;
  let arcs = 0;
  let beans = 0;
  const signature = { style: {} };
  const timeline = { style: {} };
  const layer = { style: {}, querySelector: (selector) => selector.includes("signature") ? signature : timeline };
  const canvas = { width: 0, height: 0 };
  const gradient = { addColorStop() {} };
  const context = new Proxy({
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    arc() { arcs++; },
    ellipse() { beans++; },
    fillRect() { if (failDrawing) throw new Error("Canvas renderer failed"); },
  }, { get: (object, key) => key in object ? object[key] : () => {} });
  const document = { hidden: false };
  const sandbox = {
    exports: {}, document, performance: { now: () => 0 },
    window: { innerWidth: mobile ? 390 : 1440, innerHeight: mobile ? 844 : 900, devicePixelRatio: 3, matchMedia: () => ({ matches: mobile }) },
    requestAnimationFrame: (callback) => { const id = nextFrame++; scheduled.set(id, callback); return id; },
    cancelAnimationFrame: (id) => scheduled.delete(id),
  };
  vm.runInNewContext(compiled, sandbox);
  let cancel;
  cancel = sandbox.exports.startStorm(canvas, context, layer, () => { completions++; cancel?.(); });
  // Mirrors the caller's immediate cleanup if the first frame failed.
  if (completions) cancel();
  const advance = (time) => {
    const callbacks = [...scheduled.values()];
    scheduled.clear();
    callbacks.forEach((callback) => callback(time));
  };
  return { canvas, layer, signature, timeline, scheduled, document, advance, cancel, get completions() { return completions; }, get arcs() { return arcs; }, get beans() { return beans; } };
}

test("opening reveals the wordmark, dissolves, and completes at 5.4 seconds", () => {
  const run = scene();
  assert.equal(run.completions, 0);
  run.advance(3000);
  assert.ok(Number(run.signature.style.opacity) > .8);
  run.advance(5200);
  assert.ok(Number(run.layer.style.opacity) < .2);
  run.advance(5400);
  assert.equal(run.completions, 1);
  assert.equal(run.scheduled.size, 0);
});

test("skip cancellation leaves no animation frame queued", () => {
  const run = scene();
  run.advance(1000);
  run.cancel();
  assert.equal(run.scheduled.size, 0);
  run.advance(6000);
  assert.equal(run.completions, 0);
});

test("a hidden tab immediately completes and cancels the storm", () => {
  const run = scene();
  run.document.hidden = true;
  run.advance(300);
  assert.equal(run.completions, 1);
  assert.equal(run.scheduled.size, 0);
});

test("a drawing failure calls the fallback and cancels rendering", () => {
  const run = scene({ failDrawing: true });
  assert.equal(run.completions, 1);
  assert.equal(run.scheduled.size, 0);
});

test("mobile renderer caps particles, resolution and frame rate", () => {
  const run = scene({ mobile: true });
  assert.equal(run.canvas.width, Math.round(390 * 1.25));
  assert.equal(run.canvas.height, Math.round(844 * 1.25));
  assert.equal(run.arcs + run.beans, 90);
  run.advance(100);
  const rendered = run.arcs;
  run.advance(115);
  assert.equal(run.arcs, rendered);
  run.cancel();
});
