"use client";

import { useState, useEffect } from "react";
import type { Tool } from "../../lib/catalog";
import { runTextTool } from "../../lib/text-tools";

const NO_TEXT_INPUT = new Set([
  "lorem-ipsum-generator",
  "dummy-text-generator",
  "random-text-generator",
  "invisible-text-generator",
]);

const COUNT_LABELS: Record<string, string> = {
  "text-repeater": "Number of repetitions",
  "lorem-ipsum-generator": "Number of paragraphs",
  "dummy-text-generator": "Number of paragraphs",
  "random-text-generator": "Number of words",
  "invisible-text-generator": "Number of invisible characters",
};

const INPUT_LABELS: Record<string, string> = {
  "number-to-words-converter": "Number (e.g. 1234)",
  "words-to-number-converter": "Number written in words (e.g. twelve hundred thirty four)",
  "roman-numeral-converter": "Integer or Roman numeral (e.g. 2026 or MMXXVI)",
  "binary-to-text": "8-bit binary spaces (e.g. 01001000 01101001)",
  "morse-code-decoder": "Morse code (e.g. ... --- ...)",
};

const INPUT_PLACEHOLDERS: Record<string, string> = {
  "word-counter": "Type or paste text to count words, characters, and reading time...",
  "character-counter": "Type or paste text to count characters...",
  "case-converter": "Type or paste text to convert between UPPERCASE, lowercase, Title Case, etc...",
  "text-difference-checker": "Paste original text version...",
  "fancy-text-generator": "Type phrase to generate stylish fonts (e.g. Hello World)...",
  "morse-code-translator": "Type English text to convert to Morse code...",
  "text-to-binary": "Type text to convert to binary...",
};

export default function TextToolClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  const [value, setValue] = useState(
    slug === "number-to-words-converter"
      ? "1234"
      : slug === "roman-numeral-converter"
      ? "2026"
      : ""
  );
  const [secondary, setSecondary] = useState("");
  const [count, setCount] = useState(3);
  const [length, setLength] = useState(8);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const isDifference = slug === "text-difference-checker";
  const hasCount = slug in COUNT_LABELS;
  const noTextInput = NO_TEXT_INPUT.has(slug);

  const run = () => {
    setError("");
    setResult("");
    if (!noTextInput && !value.trim()) {
      setError(isDifference ? "Enter original text." : "Enter input text first.");
      return;
    }
    if (isDifference && !secondary.trim()) {
      setError("Enter changed text version to compare.");
      return;
    }
    try {
      setResult(runTextTool(slug, value, count, length, secondary));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to run text tool.");
    }
  };

  // Real-time calculation on input change
  useEffect(() => {
    if (noTextInput || value.trim()) {
      try {
        setResult(runTextTool(slug, value, count, length, secondary));
        setError("");
      } catch (e) {}
    }
  }, [value, secondary, count, length, slug]);

  // Live text metrics
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const lineCount = value ? value.split(/\r?\n/).length : 0;
  const readingTimeSec = Math.ceil((wordCount / 200) * 60);

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Text Input Area */}
        {!noTextInput && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label className="workbench-label" htmlFor="primary-text" style={{ color: "#10213a", fontWeight: "700" }}>
              {isDifference ? "Original Text Version" : INPUT_LABELS[slug] || "Input Text"}
            </label>
            <textarea
              id="primary-text"
              rows={5}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={INPUT_PLACEHOLDERS[slug] || "Type or paste text here..."}
            />

            {/* Live Metrics Toolbar for general text inputs */}
            {value.length > 0 && !["number-to-words-converter", "roman-numeral-converter"].includes(slug) && (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.85rem", color: "#64748b" }}>
                <span><strong>{wordCount}</strong> Words</span>
                <span>•</span>
                <span><strong>{charCount}</strong> Characters</span>
                <span>•</span>
                <span><strong>{lineCount}</strong> Lines</span>
                <span>•</span>
                <span>~<strong>{readingTimeSec}s</strong> Reading Time</span>
              </div>
            )}
          </div>
        )}

        {/* Secondary Changed Text Input for Diff Checker */}
        {isDifference && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label className="workbench-label" htmlFor="changed-text" style={{ color: "#10213a", fontWeight: "700" }}>
              Changed / Modified Text Version
            </label>
            <textarea
              id="changed-text"
              rows={5}
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="Paste changed version to highlight differences..."
            />
          </div>
        )}

        {/* Option Field Controls */}
        {hasCount && (
          <label style={{ color: "#10213a", fontWeight: "600", width: "250px" }}>
            {COUNT_LABELS[slug]}
            <input
              type="number"
              min="1"
              max={slug === "invisible-text-generator" ? 10000 : 100}
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        )}

        {slug === "random-text-generator" && (
          <label style={{ color: "#10213a", fontWeight: "600", width: "250px" }}>
            Characters per Word
            <input
              type="number"
              min="1"
              max="40"
              value={length}
              onChange={(e) => setLength(Math.max(1, Number(e.target.value) || 1))}
            />
          </label>
        )}

        {/* Action Button */}
        <button type="button" onClick={run} style={{ alignSelf: "flex-start" }}>
          Run {tool.name}
        </button>

        {error && <div style={{ color: "#ef4444", padding: "0.5rem", fontWeight: "bold" }}>{error}</div>}

        {/* Result Container with High-Contrast Text Styling */}
        {result && (
          <div className="result" style={{ marginTop: "1.25rem", padding: "1.25rem", borderRadius: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Result Output</strong>
              <button
                className="secondary"
                type="button"
                onClick={() => navigator.clipboard.writeText(result)}
              >
                Copy Result
              </button>
            </div>

            <pre
              style={{
                background: "#0f172a",
                color: "#f8fafc",
                padding: "1rem",
                borderRadius: "8px",
                fontSize: "1.05rem",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                border: "1px solid #334155",
                lineHeight: "1.5",
              }}
            >
              {result}
            </pre>
          </div>
        )}

      </div>
    </section>
  );
}
