import test from "node:test";
import assert from "node:assert/strict";
import tools from "../public/tools.json" with { type: "json" };

const expected = [
  "json-formatter",
  "json-viewer",
  "epoch-converter",
  "xml-formatter",
  "base64-decoder",
  "json-validator",
  "url-decoder",
  "base64-encoder",
  "sql-formatter",
  "uuid-generator",
  "html-beautifier",
  "markdown-editor",
  "json-to-csv",
  "xml-to-json",
  "sql-beautifier",
  "yaml-validator",
  "xml-validator",
  "xml-viewer",
  "csv-to-json",
  "guid-generator",
  "json-minifier",
  "css-minifier",
  "hex-calculator",
  "html-minifier",
  "javascript-minifier",
  "css-beautifier",
  "markdown-preview",
  "regex-tester",
  "url-encoder",
  "json-to-xml",
  "css-gradient-generator",
  "css-grid-generator",
  "yaml-formatter",
  "cron-expression-generator",
  "unix-timestamp-converter",
  "yaml-to-json",
  "javascript-beautifier",
  "markdown-to-html",
  "regex-generator",
  "api-key-generator",
  "binary-calculator",
  "html-decoder",
  "html-to-markdown",
  "json-to-yaml",
  "sql-minifier",
].sort();

test("all 45 Developer Tools are present in the dedicated group", () => {
  const actual = tools
    .filter((tool) => tool.category === "Developer Tools")
    .map((tool) => tool.slug)
    .sort();
  assert.equal(actual.length, 45);
  assert.deepEqual(actual, expected);
});
