import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const tools = JSON.parse(fs.readFileSync("public/tools.json", "utf8"));
test("catalog meets 300 tool requirement", () =>
  assert.ok(tools.length >= 300));
test("every tool has a unique URL-safe slug and SEO metadata", () => {
  const slugs = new Set(tools.map((t) => t.slug));
  assert.equal(slugs.size, tools.length);
  for (const t of tools) {
    assert.match(t.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(t.metaTitle);
    assert.ok(t.metaDescription);
    assert.ok(t.category);
  }
});

test("all QR and barcode tools are covered by the dedicated workflow", () => {
  const expected = [
    "barcode-generator",
    "qr-code-generator",
    "qr-code-scanner",
    "qr-code-generator-for-url",
    "vcard-qr-code-generator",
    "wifi-qr-code-generator",
  ];
  const actual = tools
    .filter((tool) => tool.category === "QR & Barcode Tools")
    .map((tool) => tool.slug)
    .sort();
  assert.deepEqual(actual, expected.sort());
});

test("Random & Fun and General Utilities retain their complete catalog groups", () => {
  assert.equal(
    tools.filter((tool) => tool.category === "Random & Fun Tools").length,
    22,
  );
  assert.equal(
    tools.filter((tool) => tool.category === "General Utilities").length,
    27,
  );
});

function parsePageNumbers(input, maxPages) {
  if (!input || !input.trim()) return [];
  const indicesSet = new Set();
  const parts = input.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const rangeMatch = trimmed.match(/^(\d+)\s*(?:-|:|\bto\b)\s*(\d+)$/i);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      for (let p = min; p <= max; p++) {
        const idx = p - 1;
        if (idx >= 0 && idx < maxPages) indicesSet.add(idx);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!isNaN(num)) {
        const idx = num - 1;
        if (idx >= 0 && idx < maxPages) indicesSet.add(idx);
      }
    }
  }
  return Array.from(indicesSet).sort((a, b) => a - b);
}

test("PDF page range parser handles 3-5 and 1,2,3-5 correctly", () => {
  assert.deepEqual(parsePageNumbers("3-5", 10), [2, 3, 4]);
  assert.deepEqual(parsePageNumbers("1,2,3-5", 10), [0, 1, 2, 3, 4]);
  assert.deepEqual(parsePageNumbers("1, 5-7, 10", 10), [0, 4, 5, 6, 9]);
});
