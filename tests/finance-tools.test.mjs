import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  calculateFinance,
  financeDefinitions,
} from "../app/lib/finance-tools.ts";

test("all finance definitions correspond to catalog tools", () => {
  const tools = JSON.parse(fs.readFileSync("public/tools.json", "utf8"));
  const catalogSlugs = new Set(tools.map((t) => t.slug));
  for (const slug of Object.keys(financeDefinitions)) {
    assert.ok(catalogSlugs.has(slug), `Missing catalog entry for finance slug: ${slug}`);
  }
});

test("every finance calculator returns a non-empty result using its defaults", () => {
  for (const [slug, definition] of Object.entries(financeDefinitions)) {
    const values = Object.fromEntries(
      definition.fields.map((field) => [field.key, field.defaultValue]),
    );
    assert.ok(
      calculateFinance(slug, values).length > 0,
      `${slug} returned no result`,
    );
  }
});

test("common finance formulas produce known results", () => {
  assert.match(
    calculateFinance("simple-interest-calculator", {
      principal: 1000,
      rate: 10,
      years: 2,
    }),
    /200/,
  );
  assert.match(
    calculateFinance("profit-margin-calculator", { revenue: 1000, cost: 750 }),
    /25\.00%/,
  );
  assert.match(
    calculateFinance("currency-converter", { amount: 100, rate: 1.5 }),
    /150/,
  );
});
