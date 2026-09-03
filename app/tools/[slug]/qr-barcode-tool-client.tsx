"use client";

import { useRef, useState, useEffect } from "react";
import QRCode from "qrcode";
import type { Tool } from "../../lib/catalog";

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => {
  detect(
    source: ImageBitmapSource,
  ): Promise<Array<{ rawValue: string; format: string }>>;
};

function downloadCanvas(canvas: HTMLCanvasElement, name: string) {
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${name}.png`;
  link.click();
}

export default function QrBarcodeToolClient({ tool }: { tool: Tool }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [value, setValue] = useState("https://example.com");
  const [name, setName] = useState("Jane Doe");
  const [phone, setPhone] = useState("+1-555-0199");
  const [email, setEmail] = useState("jane@example.com");
  const [password, setPassword] = useState("MySecretWifi123");
  const [security, setSecurity] = useState("WPA");
  const [qrSize, setQrSize] = useState(280);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");

  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const isScanner = tool.slug === "qr-code-scanner";
  const isBarcode = tool.slug === "barcode-generator";

  const payload = () => {
    if (tool.slug === "vcard-qr-code-generator")
      return `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nTEL:${phone}\nEMAIL:${email}\nEND:VCARD`;
    if (tool.slug === "wifi-qr-code-generator")
      return `WIFI:T:${security};S:${value};P:${password};;`;
    return value.trim();
  };

  const generate = async () => {
    if (
      tool.slug === "vcard-qr-code-generator" &&
      (!name.trim() || !phone.trim())
    ) {
      return setStatus("Enter both contact name and phone number.");
    }
    const data = payload();
    if (!data) return setStatus("Enter content to encode.");
    if (!canvasRef.current) return;
    setBusy(true);
    try {
      if (isBarcode) {
        const bwipjs = await import("bwip-js");
        (bwipjs as any).toCanvas(canvasRef.current, {
          bcid: "code128",
          text: data,
          scale: 3,
          height: 14,
          includetext: true,
          textxalign: "center",
          barcolor: fgColor.replace("#", ""),
          backgroundcolor: bgColor.replace("#", ""),
        });
      } else {
        await QRCode.toCanvas(canvasRef.current, data, {
          width: qrSize,
          margin: 2,
          color: {
            dark: fgColor,
            light: bgColor,
          },
          errorCorrectionLevel: "M",
        });
      }
      setStatus(`${isBarcode ? "Barcode" : "QR code"} ready.`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not generate code.",
      );
    } finally {
      setBusy(false);
    }
  };

  // Auto-generate on change
  useEffect(() => {
    if (!isScanner) {
      generate();
    }
  }, [value, name, phone, email, password, security, qrSize, fgColor, bgColor]);

  const scan = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    try {
      const Detector = (
        window as typeof window & {
          BarcodeDetector?: BarcodeDetectorConstructor;
        }
      ).BarcodeDetector;
      if (!Detector)
        throw new Error(
          "QR scanning requires BarcodeDetector API (available in Chrome, Edge, Safari).",
        );
      const bitmap = await createImageBitmap(file);
      const codes = await new Detector({ formats: ["qr_code"] }).detect(bitmap);
      bitmap.close();
      setStatus(
        codes.length
          ? `Decoded: ${codes[0].rawValue}`
          : "No QR code detected in this image.",
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Could not scan image.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (isScanner)
    return (
      <section className="workbench">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <label className="workbench-label" htmlFor="qr-upload" style={{ color: "#10213a", fontWeight: "700" }}>
            Upload Image Containing QR Code
          </label>
          <input
            id="qr-upload"
            type="file"
            accept="image/*"
            onChange={(e) => scan(e.target.files?.[0] || null)}
          />
          {busy && <p style={{ fontWeight: "600" }}>Scanning image…</p>}
          {status && (
            <div className="result" style={{ marginTop: "1rem", padding: "1.25rem", borderRadius: "12px" }}>
              <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Scan Output</strong>
              <pre style={{ background: "#0f172a", color: "#38bdf8", padding: "1rem", borderRadius: "8px", fontSize: "1.1rem", fontFamily: "monospace", marginTop: "0.5rem" }}>
                {status}
              </pre>
              {status.startsWith("Decoded:") && (
                <button
                  className="secondary"
                  onClick={() => navigator.clipboard.writeText(status.slice(9))}
                  style={{ marginTop: "0.75rem" }}
                >
                  Copy Result
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    );

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {tool.slug !== "vcard-qr-code-generator" && (
          <label className="workbench-label" htmlFor="code-value" style={{ color: "#10213a", fontWeight: "700" }}>
            {tool.slug === "wifi-qr-code-generator"
              ? "Wi-Fi Network SSID"
              : tool.slug === "qr-code-generator-for-url"
                ? "Website URL"
                : isBarcode
                  ? "Barcode Value / Text"
                  : "Content to Encode"}
            <input
              id="code-value"
              type={tool.slug === "qr-code-generator-for-url" ? "url" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={
                tool.slug === "qr-code-generator-for-url"
                  ? "https://example.com"
                  : "Enter content to encode..."
              }
            />
          </label>
        )}

        {tool.slug === "vcard-qr-code-generator" && (
          <div className="input-grid">
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Contact Name
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Phone Number
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Email Address
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          </div>
        )}

        {tool.slug === "wifi-qr-code-generator" && (
          <div className="input-grid">
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Security Protocol
              <select value={security} onChange={(e) => setSecurity(e.target.value)}>
                <option value="WPA">WPA / WPA2 / WPA3</option>
                <option value="WEP">WEP</option>
                <option value="nopass">Open (No Password)</option>
              </select>
            </label>
            {security !== "nopass" && (
              <label style={{ color: "#10213a", fontWeight: "600" }}>
                Wi-Fi Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
            )}
          </div>
        )}

        {/* Customization Options */}
        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10213a", fontWeight: "600" }}>
            Foreground:
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              style={{ width: "40px", height: "35px", padding: "2px", cursor: "pointer", margin: 0 }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10213a", fontWeight: "600" }}>
            Background:
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              style={{ width: "40px", height: "35px", padding: "2px", cursor: "pointer", margin: 0 }}
            />
          </label>

          {!isBarcode && (
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#10213a", fontWeight: "600" }}>
              Size: {qrSize}px
              <input
                type="range"
                min="160"
                max="480"
                step="20"
                value={qrSize}
                onChange={(e) => setQrSize(Number(e.target.value))}
                style={{ width: "120px", margin: 0 }}
              />
            </label>
          )}
        </div>

        {/* Canvas Render Output Box */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "1.5rem",
            background: "#0f172a",
            borderRadius: "12px",
            border: "1px solid #334155",
            gap: "1rem",
          }}
        >
          <canvas ref={canvasRef} style={{ background: "#ffffff", padding: "8px", borderRadius: "8px" }} />

          <button
            type="button"
            onClick={() => canvasRef.current && downloadCanvas(canvasRef.current, tool.slug)}
            style={{
              background: "#10b981",
              color: "#ffffff",
              fontWeight: "bold",
              padding: "0.6rem 1.5rem",
              borderRadius: "8px",
            }}
          >
            📥 Download {isBarcode ? "Barcode PNG" : "QR Code PNG"}
          </button>
        </div>

      </div>
    </section>
  );
}
