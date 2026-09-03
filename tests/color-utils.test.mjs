import test from "node:test";
import assert from "node:assert/strict";
import {
  contrastRatio,
  hexToRgb,
  normalizeHex,
  rgbToHex,
} from "../app/lib/color-utils.ts";

test("normalizes short and long HEX colors", () => {
  assert.equal(normalizeHex("abc"), "#AABBCC");
  assert.equal(normalizeHex("#1463da"), "#1463DA");
});
test("converts HEX to RGB", () =>
  assert.deepEqual(hexToRgb("#1463DA"), { red: 20, green: 99, blue: 218 }));
test("converts RGB to HEX", () =>
  assert.equal(rgbToHex(20, 99, 218), "#1463DA"));
test("rejects invalid RGB channels", () =>
  assert.throws(() => rgbToHex(256, 0, 0), /0 to 255/));
test("calculates WCAG black and white contrast", () =>
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21));
