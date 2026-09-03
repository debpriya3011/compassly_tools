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
