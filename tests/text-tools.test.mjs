import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  fromRoman,
  numberToWords,
  runTextTool,
  textDifference,
  toRoman,
  wordsToNumber,
} from "../app/lib/text-tools.ts";

test("number and word converters perform real conversion", () => {
  assert.equal(numberToWords(1234), "one thousand two hundred thirty four");
  assert.equal(wordsToNumber("two thousand and nineteen"), 2019);
});

test("Roman numerals convert in both directions and reject invalid forms", () => {
  assert.equal(toRoman(1994), "MCMXCIV");
  assert.equal(fromRoman("MCMXCIV"), 1994);
  assert.throws(() => fromRoman("IIII"));
});

test("difference checker identifies actual additions and removals", () => {
  const diff = textDifference("the quick fox", "the slow fox jumps");
  assert.equal(diff.added, 2);
  assert.equal(diff.removed, 1);
  assert.match(diff.output, /\+ slow/);
  assert.match(diff.output, /- quick/);
});

test("generators do not depend on fake seed input", () => {
  assert.equal(
    runTextTool("lorem-ipsum-generator", "", 2).split("\n\n").length,
    2,
  );
  assert.equal(
    runTextTool("random-text-generator", "", 3, 5).split(" ").length,
    3,
  );
  assert.equal([...runTextTool("invisible-text-generator", "", 7)].length, 7);
});

test("specialized text encoders and counters return meaningful output", () => {
  assert.equal(runTextTool("braille-translator", "abc"), "⠁⠃⠉");
  assert.equal(runTextTool("text-to-binary", "A"), "01000001");
  assert.equal(runTextTool("binary-to-text", "01000001"), "A");
  assert.match(runTextTool("word-counter", "one two"), /^2 words/);
});

test("every catalogued Text Tool has a configured workflow", () => {
  const tools = JSON.parse(fs.readFileSync("public/tools.json", "utf8")).filter(
    (tool) => tool.category === "Text Tools",
  );
  assert.equal(tools.length, 23);
  const samples = {
    "binary-to-text": "01000001",
    "morse-code-decoder": ".-",
    "number-to-words-converter": "42",
    "roman-numeral-converter": "XLII",
    "words-to-number-converter": "forty two",
  };
  for (const tool of tools) {
    const output = runTextTool(
      tool.slug,
      samples[tool.slug] || "sample text",
      2,
      8,
      "sample changed text",
    );
    assert.ok(output.length > 0, `${tool.slug} returned no output`);
  }
});
