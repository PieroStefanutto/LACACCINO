import assert from "node:assert/strict";

const origin = process.argv[2] || "http://127.0.0.1:3000";
const response = await fetch(origin);
assert.equal(response.status, 200);
const html = await response.text();
// Check server-rendered content, not strings embedded in hydration scripts.
const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
for (const text of ["Geplanter Markenstart 2029", "Kaffee to go, als Luxus gedacht.", "Intro überspringen", "Kaffee &amp; Rituale", "Mallorca", "Stuttgart", "Hamburg", "Bangkok", "London", "Dubai"]) {
  assert.ok(markup.includes(text), `Fehlender Inhalt: ${text}`);
}
const ids = new Set([...markup.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
const anchors = [...markup.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
for (const anchor of anchors) assert.ok(ids.has(anchor), `Fehlendes Sprungziel: ${anchor}`);
assert.match(markup, /class="coffee-storm" hidden=""/);
assert.match(markup, /<details class="mobile-menu"/);
assert.equal((markup.match(/<h1\b/g) || []).length, 1);

const imageTags = [...markup.matchAll(/<img\b[^>]*>/g)].map((match) => match[0]);
assert.ok(imageTags.every((tag) => /\balt="/.test(tag)), "Bildbeschreibungen fehlen");
const urls = [...new Set(imageTags.map((tag) => tag.match(/\bsrc="([^"]+)"/)?.[1]).filter(Boolean))];
const imageResults = await Promise.all(urls.map(async (encoded) => {
  const url = encoded.replaceAll("&amp;", "&");
  const result = await fetch(origin + url, { headers: { accept: "image/webp" } });
  assert.equal(result.status, 200, url);
  assert.match(result.headers.get("content-type"), /^image\//);
  return { format: result.headers.get("content-type"), bytes: (await result.arrayBuffer()).byteLength };
}));
const styles = [...markup.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)]
  .map((match) => match[0].match(/href="([^"]+)"/)?.[1]).filter(Boolean);
for (const path of styles) assert.equal((await fetch(origin + path.replaceAll("&amp;", "&"))).status, 200);

console.log(JSON.stringify({ httpStatus: response.status, serverContentPresent: true, anchorLinks: anchors.length, allTargetsExist: true, images: imageResults, stylesheets: styles.length }, null, 2));
