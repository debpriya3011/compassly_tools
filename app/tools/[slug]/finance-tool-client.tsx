"use client";

import { useState } from "react";
import type { Tool } from "../../lib/catalog";
import { calculateFinance, financeDefinitions } from "../../lib/finance-tools";

import GeneralUtilityClient from "./general-utility-client";

export default function FinanceToolClient({ tool }: { tool: Tool }) {
  const definition = financeDefinitions[tool.slug];
  if (!definition) {
    return <GeneralUtilityClient tool={tool} />;
  }

  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      definition.fields.map((field) => [field.key, field.defaultValue]),
    ),
  );
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  function run() {
    setError("");
    try {
      setResult(calculateFinance(tool.slug, values));
    } catch (cause) {
      setResult("");
      setError(
        cause instanceof Error
          ? cause.message
          : "Unable to calculate a result.",
      );
    }
  }

  return (
    <section className="workbench">
      <div className="input-grid">
        {definition.fields.map((field) => (
          <label key={field.key}>
            {field.label}
            <input
              type="number"
              min={field.min}
              step={field.step}
              value={values[field.key]}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [field.key]: event.target.valueAsNumber,
                }))
              }
            />
          </label>
        ))}
      </div>
      {definition.note && <p className="privacy-note">{definition.note}</p>}
      <button type="button" onClick={run}>
        Calculate {tool.name}
      </button>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="result" aria-live="polite" style={{ marginTop: "1.5rem", padding: "1.25rem", borderRadius: "12px" }}>
          <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Result</strong>
          <pre style={{ background: "#0f172a", color: "#f8fafc", padding: "1rem", borderRadius: "8px", fontSize: "1.05rem", fontFamily: "monospace", whiteSpace: "pre-wrap", border: "1px solid #334155", margin: "0.75rem 0" }}>{result}</pre>
          <button
            className="secondary"
            type="button"
            onClick={() => navigator.clipboard.writeText(result)}
          >
            Copy result
          </button>
        </div>
      )}
      <p className="privacy-note">
        Results are estimates for planning and comparison, not financial or tax
        advice.
      </p>
    </section>
  );
}
