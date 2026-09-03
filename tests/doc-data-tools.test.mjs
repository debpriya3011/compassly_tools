import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import XLSX from "xlsx";
import { workflowGroupFor } from "../app/lib/workflow-routing.ts";

test("all 11 Document & Data Converters tools are routed to document-data workflow group", () => {
  const tools = JSON.parse(fs.readFileSync("public/tools.json", "utf8")).filter(
    (tool) => tool.category === "Document & Data Converters",
  );
  assert.equal(tools.length, 11);
  for (const tool of tools) {
    const group = workflowGroupFor(tool);
    assert.equal(
      group,
      "document-data",
      `Tool ${tool.slug} should map to document-data workflow group`,
    );
  }
});

test("CSV to Excel conversion produces valid XLSX workbook buffer", () => {
  const csvData = "Name,Age,Role\nAlice,30,Engineer\nBob,25,Designer";
  const workbook = XLSX.read(csvData, { type: "string", raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ["Name", "Age", "Role"]);
  assert.deepEqual(rows[1], ["Alice", "30", "Engineer"]);

  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
  assert.ok(wbout instanceof Buffer || wbout instanceof Uint8Array);
  assert.ok(wbout.length > 0);
});

test("Excel to CSV and JSON conversions return correct structures", () => {
  const sampleObj = [
    { Product: "Widget A", Price: 10.5, InStock: true },
    { Product: "Widget B", Price: 25.0, InStock: false },
  ];
  const sheet = XLSX.utils.json_to_sheet(sampleObj);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Products");

  const csvText = XLSX.utils.sheet_to_csv(sheet);
  assert.match(csvText, /Product,Price,InStock/);
  assert.match(csvText, /Widget A,10\.5,TRUE/);

  const jsonExtracted = XLSX.utils.sheet_to_json(sheet);
  assert.equal(jsonExtracted.length, 2);
  assert.equal(jsonExtracted[0].Product, "Widget A");
  assert.equal(jsonExtracted[1].Price, 25);
});
