"use client";

import { useState } from "react";
import type { Tool } from "../../lib/catalog";
import {
  contrastRatio,
  hexToRgb,
  normalizeHex,
  rgbToHex,
} from "../../lib/color-utils";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const { red, green, blue } = hexToRgb(normalizeHex(hex));
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function CopyButton({ value }: { value: string }) {
  return (
    <button
      className="secondary"
      type="button"
      onClick={() => navigator.clipboard.writeText(value)}
      style={{ padding: "0.35rem 0.75rem", fontSize: "0.85rem" }}
    >
      Copy
    </button>
  );
}

export default function ColorToolClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  const [hex, setHex] = useState("#2563EB");
  const [red, setRed] = useState("37");
  const [green, setGreen] = useState("99");
  const [blue, setBlue] = useState("235");

  const [foreground, setForeground] = useState("#0F172A");
  const [background, setBackground] = useState("#F8FAFC");

  const [error, setError] = useState("");

  const currentHex = slug === "rgb-to-hex-converter"
    ? rgbToHex(Number(red) || 0, Number(green) || 0, Number(blue) || 0)
    : normalizeHex(hex);

  const rgbObj = hexToRgb(currentHex);
  const hslObj = hexToHsl(currentHex);
  const ratio = contrastRatio(foreground, background);

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* --- CONTRAST CHECKER --- */}
        {slug === "color-contrast-checker" && (
          <>
            <div className="color-input-grid">
              <label style={{ color: "#10213a", fontWeight: "700" }}>
                Foreground Text Color
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input
                    type="color"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    style={{ width: "50px", height: "42px", padding: "2px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                    style={{ margin: 0 }}
                  />
                </div>
              </label>
              <label style={{ color: "#10213a", fontWeight: "700" }}>
                Background Color
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    style={{ width: "50px", height: "42px", padding: "2px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    style={{ margin: 0 }}
                  />
                </div>
              </label>
            </div>

            {/* Live Interactive Preview Box */}
            <div
              style={{
                color: foreground,
                backgroundColor: background,
                padding: "2rem",
                borderRadius: "12px",
                border: "2px solid #cbd5e1",
                boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div style={{ fontSize: "1.5rem", fontWeight: "800" }}>
                Contrast Ratio: {ratio.toFixed(2)}:1
              </div>
              <div style={{ fontSize: "1rem", lineHeight: "1.6" }}>
                The quick brown fox jumps over the lazy dog. Readable typography is essential for accessibility.
              </div>
              <button
                type="button"
                style={{
                  color: foreground,
                  backgroundColor: background,
                  border: `2px solid ${foreground}`,
                  alignSelf: "flex-start",
                  padding: "0.5rem 1rem",
                  fontWeight: "bold",
                }}
              >
                Sample UI Button
              </button>
            </div>

            {/* WCAG Compliance Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Normal Text AA (4.5:1)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: ratio >= 4.5 ? "#34d399" : "#f43f5e" }}>
                  {ratio >= 4.5 ? "✓ PASS" : "✗ FAIL"}
                </div>
              </div>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Normal Text AAA (7:1)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: ratio >= 7 ? "#34d399" : "#f43f5e" }}>
                  {ratio >= 7 ? "✓ PASS" : "✗ FAIL"}
                </div>
              </div>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Large Text AA (3:1)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: ratio >= 3 ? "#34d399" : "#f43f5e" }}>
                  {ratio >= 3 ? "✓ PASS" : "✗ FAIL"}
                </div>
              </div>
              <div style={{ padding: "0.85rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontSize: "0.85rem", marginBottom: "0.25rem" }}>UI Components (3:1)</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: ratio >= 3 ? "#34d399" : "#f43f5e" }}>
                  {ratio >= 3 ? "✓ PASS" : "✗ FAIL"}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- HEX / RGB CONVERTER --- */}
        {slug !== "color-contrast-checker" && (
          <>
            {slug === "hex-to-rgb-converter" ? (
              <label style={{ color: "#10213a", fontWeight: "700" }}>
                HEX Color Value
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <input
                    type="color"
                    value={currentHex}
                    onChange={(e) => setHex(e.target.value)}
                    style={{ width: "55px", height: "45px", padding: "2px", cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    value={hex}
                    onChange={(e) => setHex(e.target.value)}
                    placeholder="#2563EB"
                    style={{ margin: 0, fontSize: "1.1rem" }}
                  />
                </div>
              </label>
            ) : (
              <div className="color-input-grid">
                <label style={{ color: "#10213a", fontWeight: "600" }}>
                  Red (0-255)
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={red}
                    onChange={(e) => setRed(e.target.value)}
                  />
                </label>
                <label style={{ color: "#10213a", fontWeight: "600" }}>
                  Green (0-255)
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={green}
                    onChange={(e) => setGreen(e.target.value)}
                  />
                </label>
                <label style={{ color: "#10213a", fontWeight: "600" }}>
                  Blue (0-255)
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={blue}
                    onChange={(e) => setBlue(e.target.value)}
                  />
                </label>
              </div>
            )}

            {/* Live Color Swatch & Conversion Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: "1.5rem", alignItems: "center" }}>
              <div
                style={{
                  height: "140px",
                  borderRadius: "16px",
                  backgroundColor: currentHex,
                  boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
                  border: "3px solid #ffffff",
                }}
              />

              <div style={{ display: "grid", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div>
                    <span style={{ color: "#cbd5e1", fontSize: "0.8rem", marginRight: "0.5rem" }}>HEX:</span>
                    <strong style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: "1.1rem" }}>{currentHex.toUpperCase()}</strong>
                  </div>
                  <CopyButton value={currentHex.toUpperCase()} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div>
                    <span style={{ color: "#cbd5e1", fontSize: "0.8rem", marginRight: "0.5rem" }}>RGB:</span>
                    <strong style={{ color: "#34d399", fontFamily: "monospace", fontSize: "1.1rem" }}>
                      rgb({rgbObj.red}, {rgbObj.green}, {rgbObj.blue})
                    </strong>
                  </div>
                  <CopyButton value={`rgb(${rgbObj.red}, ${rgbObj.green}, ${rgbObj.blue})`} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
                  <div>
                    <span style={{ color: "#cbd5e1", fontSize: "0.8rem", marginRight: "0.5rem" }}>HSL:</span>
                    <strong style={{ color: "#f8fafc", fontFamily: "monospace", fontSize: "1.1rem" }}>
                      hsl({hslObj.h}, {hslObj.s}%, {hslObj.l}%)
                    </strong>
                  </div>
                  <CopyButton value={`hsl(${hslObj.h}, ${hslObj.s}%, ${hslObj.l}%)`} />
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </section>
  );
}
