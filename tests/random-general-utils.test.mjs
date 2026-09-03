import test from "node:test";
import assert from "node:assert/strict";
import {
  randomInteger,
  stablePercentage,
} from "../app/lib/random-fun-utils.ts";
import {
  extractPhones,
  generateFakeAddress,
  generatePassword,
  passwordStrength,
  removeEmoji,
  slugify,
} from "../app/lib/general-utils.ts";

test("love score is stable for the same pair", () =>
  assert.equal(
    stablePercentage("Alex", "Sam"),
    stablePercentage("Alex", "Sam"),
  ));
test("random integers stay within inclusive bounds", () => {
  for (let index = 0; index < 100; index++)
    assert.ok([1, 2].includes(randomInteger(1, 2)));
});
test("slug generator normalizes text", () =>
  assert.equal(slugify("  Café Tools!  "), "cafe-tools"));
test("emoji remover preserves ordinary text", () =>
  assert.equal(removeEmoji("Hello 👋 world"), "Hello  world"));
test("phone extraction finds international numbers", () =>
  assert.deepEqual(extractPhones("Call +91 98765 43210 today"), [
    "+91 98765 43210",
  ]));
test("strong password is rated very strong", () =>
  assert.equal(passwordStrength("LongPassword12!"), "Very strong"));
test("password options control included character sets", () => {
  const password = generatePassword(24, {
    uppercase: false,
    lowercase: true,
    numbers: true,
    symbols: false,
    excludeAmbiguous: true,
  });
  assert.equal(password.length, 24);
  assert.match(password, /^[a-z2-9]+$/);
  assert.doesNotMatch(password, /[Il1O0o]/);
});
test("password generator rejects an empty character selection", () =>
  assert.throws(
    () =>
      generatePassword(16, {
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
        excludeAmbiguous: false,
      }),
    /at least one/,
  ));

test("fake address generator produces structured, clearly fictional data", () => {
  const address = generateFakeAddress("in");
  assert.match(address, /Example|Sample|Placeholder|Demo/);
  assert.match(address, /India/);
  assert.equal(address.split("\n").length, 4);
});
