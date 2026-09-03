"use client";

import { useState } from "react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import TurndownService from "turndown";
import YAML from "yaml";
import { format as formatSql } from "sql-formatter";
import {
  css as beautifyCss,
  html as beautifyHtml,
  js as beautifyJs,
} from "js-beautify";
import type { Tool } from "../../lib/catalog";

const encodeBase64 = (value: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)));
const decodeBase64 = (value: string) =>
  new TextDecoder().decode(
    Uint8Array.from(atob(value.trim()), (character) => character.charCodeAt(0)),
  );
const csvRows = (value: string) =>
  value
    .trim()
    .split(/\r?\n/)
    .map((row) => row.split(",").map((cell) => cell.trim()));
const csvToObjects = (value: string) => {
  const [headers, ...rows] = csvRows(value);
  return rows.map((row) =>
    Object.fromEntries(
      headers.map((header, index) => [header, row[index] ?? ""]),
    ),
  );
};
const objectsToCsv = (value: unknown) => {
  const rows = Array.isArray(value) ? value : [value];
  if (
    !rows.every((row) => row && typeof row === "object" && !Array.isArray(row))
  )
    throw new Error("JSON must contain an object or array of objects.");
  const headers = [
    ...new Set(rows.flatMap((row) => Object.keys(row as object))),
  ];
  const escape = (cell: unknown) => {
    const text = String(cell ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => escape((row as Record<string, unknown>)[header]))
        .join(","),
    ),
  ].join("\n");
};
const xmlFromValue = (value: unknown, name = "root"): string => {
  if (Array.isArray(value))
    return `<${name}>${value.map((item) => xmlFromValue(item, "item")).join("")}</${name}>`;
  if (value && typeof value === "object")
    return `<${name}>${Object.entries(value)
      .map(([key, item]) => xmlFromValue(item, key))
      .join("")}</${name}>`;
  return `<${name}>${String(value ?? "").replace(/[<>&'"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character]!)}</${name}>`;
};
const minify = (value: string) =>
  value
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>])\s*/g, "$1")
    .trim();

function formatXml(value: string) {
  const parsed = new DOMParser().parseFromString(value, "application/xml");
  const error = parsed.querySelector("parsererror");
  if (error) throw new Error(error.textContent || "Invalid XML.");
  const compact = new XMLSerializer().serializeToString(parsed);
  let depth = 0;
  return compact
    .replace(/(>)(<)(\/*)/g, "$1\n$2$3")
    .split("\n")
    .map((line) => {
      if (/^<\//.test(line)) depth--;
      const output = `${"  ".repeat(Math.max(0, depth))}${line}`;
      if (/^<[^!?/][^>]*[^/]?>/.test(line) && !/<\/[^>]+>$/.test(line)) depth++;
      return output;
    })
    .join("\n");
}
function xmlToObject(node: Element): unknown {
  const children = [...node.children];
  if (!children.length) return node.textContent || "";
  return children.reduce<Record<string, unknown>>((result, child) => {
    const value = xmlToObject(child);
    const existing = result[child.tagName];
    result[child.tagName] =
      existing === undefined
        ? value
        : Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
    return result;
  }, {});
}

export default function DeveloperToolClient({ tool }: { tool: Tool }) {
  const [input, setInput] = useState("");
  const [secondary, setSecondary] = useState("");
  const [result, setResult] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const run = () => {
    setError("");
    setPreview("");
    try {
      const slug = tool.slug;
      let output = "";
      if (/json-(formatter|viewer)/.test(slug))
        output = JSON.stringify(JSON.parse(input), null, 2);
      else if (slug === "json-minifier")
        output = JSON.stringify(JSON.parse(input));
      else if (slug === "json-validator") {
        JSON.parse(input);
        output = "Valid JSON";
      } else if (slug === "base64-encoder") output = encodeBase64(input);
      else if (slug === "base64-decoder") output = decodeBase64(input);
      else if (slug === "url-encoder") output = encodeURIComponent(input);
      else if (slug === "url-decoder") output = decodeURIComponent(input);
      else if (/uuid|guid/.test(slug)) output = crypto.randomUUID();
      else if (slug === "api-key-generator")
        output = Array.from(
          crypto.getRandomValues(new Uint8Array(32)),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("");
      else if (/xml-(formatter|viewer)/.test(slug)) output = formatXml(input);
      else if (slug === "xml-validator") {
        formatXml(input);
        output = "Valid XML";
      } else if (slug === "xml-to-json") {
        const document = new DOMParser().parseFromString(
          input,
          "application/xml",
        );
        if (document.querySelector("parsererror"))
          throw new Error("Invalid XML.");
        output = JSON.stringify(
          {
            [document.documentElement.tagName]: xmlToObject(
              document.documentElement,
            ),
          },
          null,
          2,
        );
      } else if (slug === "json-to-xml")
        output = formatXml(xmlFromValue(JSON.parse(input)));
      else if (slug === "json-to-csv") output = objectsToCsv(JSON.parse(input));
      else if (slug === "csv-to-json")
        output = JSON.stringify(csvToObjects(input), null, 2);
      else if (/yaml-(formatter|validator)/.test(slug)) {
        const parsed = YAML.parse(input);
        output = slug.includes("validator")
          ? "Valid YAML"
          : YAML.stringify(parsed);
      } else if (slug === "yaml-to-json")
        output = JSON.stringify(YAML.parse(input), null, 2);
      else if (slug === "json-to-yaml")
        output = YAML.stringify(JSON.parse(input));
      else if (/sql-(formatter|beautifier)/.test(slug))
        output = formatSql(input);
      else if (slug === "sql-minifier")
        output = input.replace(/--.*$/gm, "").replace(/\s+/g, " ").trim();
      else if (slug === "html-beautifier")
        output = beautifyHtml(input, { indent_size: 2 });
      else if (slug === "css-beautifier")
        output = beautifyCss(input, { indent_size: 2 });
      else if (slug === "javascript-beautifier")
        output = beautifyJs(input, { indent_size: 2 });
      else if (slug === "html-minifier")
        output = input
          .replace(/<!--([\s\S]*?)-->/g, "")
          .replace(/>\s+</g, "><")
          .trim();
      else if (slug === "css-minifier" || slug === "javascript-minifier")
        output = minify(input);
      else if (/markdown-(editor|preview)|markdown-to-html/.test(slug)) {
        output = String(marked.parse(input));
        setPreview(DOMPurify.sanitize(output));
      } else if (slug === "html-to-markdown")
        output = new TurndownService().turndown(input);
      else if (slug === "html-decoder") {
        const element = document.createElement("textarea");
        element.innerHTML = input;
        output = element.value;
      } else if (slug === "regex-tester") {
        const match = [...input.matchAll(new RegExp(secondary, "g"))];
        output = `${match.length} matches\n${match.map((item) => `${item.index}: ${item[0]}`).join("\n")}`;
      } else if (slug === "regex-generator")
        output = input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      else if (/epoch|unix-timestamp/.test(slug)) {
        const numeric = Number(input);
        output =
          Number.isFinite(numeric) && input.trim()
            ? new Date(numeric * (numeric < 1e12 ? 1000 : 1)).toISOString()
            : String(Math.floor(new Date(input).getTime() / 1000));
      } else if (slug === "hex-calculator") {
        const match = input.match(
          /^\s*([0-9a-f]+)\s*([+\-*/])\s*([0-9a-f]+)\s*$/i,
        );
        if (!match)
          throw new Error("Use a hexadecimal expression such as A + F.");
        const [left, right] = [parseInt(match[1], 16), parseInt(match[3], 16)];
        const value = {
          "+": left + right,
          "-": left - right,
          "*": left * right,
          "/": Math.trunc(left / right),
        }[match[2]]!;
        output = `${value.toString(16).toUpperCase()} (decimal ${value})`;
      } else if (slug === "binary-calculator") {
        const match = input.match(/^\s*([01]+)\s*([+\-*/])\s*([01]+)\s*$/);
        if (!match)
          throw new Error("Use a binary expression such as 1010 + 11.");
        const [left, right] = [parseInt(match[1], 2), parseInt(match[3], 2)];
        const value = {
          "+": left + right,
          "-": left - right,
          "*": left * right,
          "/": Math.trunc(left / right),
        }[match[2]]!;
        output = `${value.toString(2)} (decimal ${value})`;
      } else if (slug === "css-gradient-generator")
        output = `background: linear-gradient(135deg, ${input || "#1463DA"}, ${secondary || "#7C3AED"});`;
      else if (slug === "css-grid-generator")
        output = `.grid {\n  display: grid;\n  grid-template-columns: repeat(${Number(input) || 3}, 1fr);\n  gap: ${Number(secondary) || 16}px;\n}`;
      else if (slug === "cron-expression-generator")
        output =
          (
            {
              hourly: "0 * * * *",
              daily: "0 0 * * *",
              weekly: "0 0 * * 0",
              monthly: "0 0 1 * *",
            } as Record<string, string>
          )[input.trim().toLowerCase()] || input;
      else throw new Error("This developer workflow is not implemented.");
      setResult(output);
    } catch (caught) {
      setResult("");
      setError(caught instanceof Error ? caught.message : "Processing failed.");
    }
  };
  const needsSecondary = [
    "regex-tester",
    "css-gradient-generator",
    "css-grid-generator",
  ].includes(tool.slug);
  return (
    <section className="workbench">
      <label className="workbench-label" htmlFor="developer-input">
        {tool.slug === "regex-tester" ? "Test text" : "Input"}
      </label>
      <textarea
        id="developer-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={
          /uuid|guid|api-key/.test(tool.slug)
            ? "No input required"
            : "Paste code or data here…"
        }
      />
      {needsSecondary && (
        <label>
          {tool.slug === "regex-tester" ? "Regular expression" : "Second value"}
          <input
            value={secondary}
            onChange={(event) => setSecondary(event.target.value)}
          />
        </label>
      )}
      <button onClick={run}>Run {tool.name}</button>
      {error && <p className="error-message">{error}</p>}
      {result && (
        <div className="result">
          <strong>Result</strong>
          {preview ? (
            <div
              className="rendered-preview"
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          ) : (
            <pre>{result}</pre>
          )}
          <button
            className="secondary"
            onClick={() => navigator.clipboard.writeText(result)}
          >
            Copy result
          </button>
          <button
            className="secondary"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([result], { type: "text/plain" }),
              );
              const link = document.createElement("a");
              link.href = url;
              link.download = `${tool.slug}.txt`;
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download result
          </button>
        </div>
      )}
    </section>
  );
}
