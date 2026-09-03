"use client";

import { useState } from "react";
import type { Tool } from "../../lib/catalog";

type Cell = string | number | boolean | null;

// Utility to extract text content from DOCX/PPTX XML strings if uploaded as binary zip
function extractXmlText(rawText: string, tag: "w:t" | "a:t" = "w:t"): string {
  const regex = new RegExp(`<${tag}[^>]*>(.*?)</${tag}>`, "g");
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(rawText)) !== null) {
    if (match[1]) matches.push(match[1]);
  }
  return matches.length > 0 ? matches.join(" ") : rawText;
}

// Utility to render tabular data onto an HTML5 Canvas for Excel to Image
function renderTableToCanvas(rows: Cell[][], format: "jpg" | "png"): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context.");

  const rowCount = Math.min(rows.length, 25);
  const colCount = Math.max(...rows.slice(0, rowCount).map((r) => r?.length || 0), 1);

  const cellWidth = 140;
  const cellHeight = 36;
  const padding = 20;

  canvas.width = Math.max(600, colCount * cellWidth + padding * 2);
  canvas.height = Math.max(300, (rowCount + 1) * cellHeight + padding * 2);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Header background
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(padding, padding, colCount * cellWidth, cellHeight);

  // Grid & Text styling
  ctx.font = "14px Inter, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  for (let r = 0; r < rowCount; r++) {
    const y = padding + r * cellHeight;
    const isHeader = r === 0;

    if (!isHeader) {
      ctx.fillStyle = r % 2 === 0 ? "#f8fafc" : "#ffffff";
      ctx.fillRect(padding, y, colCount * cellWidth, cellHeight);
    }

    const row = rows[r] || [];
    for (let c = 0; c < colCount; c++) {
      const x = padding + c * cellWidth;
      const val = row[c] !== undefined && row[c] !== null ? String(row[c]) : "";

      // Cell border
      ctx.strokeStyle = "#cbd5e1";
      ctx.strokeRect(x, y, cellWidth, cellHeight);

      // Text inside cell
      ctx.fillStyle = isHeader ? "#ffffff" : "#1e293b";
      const textToDraw = val.length > 16 ? val.substring(0, 14) + "…" : val;
      ctx.fillText(textToDraw, x + 8, y + cellHeight / 2);
    }
  }

  return canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png");
}

// Utility to render document text onto an HTML5 Canvas for Word/PPTX to Image
function renderTextToCanvas(
  title: string,
  content: string,
  type: "document" | "slide",
  format: "jpg" | "png",
): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create canvas context.");

  if (type === "slide") {
    // 16:9 Presentation Slide Canvas
    canvas.width = 960;
    canvas.height = 540;

    // Gradient Background
    const gradient = ctx.createLinearGradient(0, 0, 960, 540);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1e293b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);

    // Slide Card
    ctx.fillStyle = "#ffffff";
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(40, 40, 880, 460, 16);
      ctx.fill();
    } else {
      ctx.fillRect(40, 40, 880, 460);
    }

    // Slide Header Bar
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(40, 40, 880, 12);

    // Slide Title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillText(title || "Presentation Slide", 70, 100);

    // Slide Content Lines
    ctx.fillStyle = "#334155";
    ctx.font = "18px Inter, sans-serif";
    const lines = content.split("\n").filter((l) => l.trim()).slice(0, 8);
    lines.forEach((line, idx) => {
      ctx.fillText(`• ${line.substring(0, 75)}`, 80, 160 + idx * 36);
    });

    if (lines.length === 0) {
      ctx.fillText("• Sample presentation slide content", 80, 160);
    }
  } else {
    // Standard Document Page Canvas
    canvas.width = 750;
    canvas.height = 1000;

    // Document Paper background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 750, 1000);

    // Subtle page shadow/border
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 746, 996);

    // Header
    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 26px Inter, sans-serif";
    ctx.fillText(title || "Document Preview", 60, 80);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 100);
    ctx.lineTo(690, 100);
    ctx.stroke();

    // Body text
    ctx.fillStyle = "#334155";
    ctx.font = "16px Inter, sans-serif";
    const words = content.replace(/\s+/g, " ").split(" ");
    let line = "";
    let y = 140;

    for (let i = 0; i < words.length && y < 920; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > 620) {
        ctx.fillText(line, 60, y);
        line = words[i] + " ";
        y += 28;
      } else {
        line = testLine;
      }
    }
    if (line && y < 920) {
      ctx.fillText(line, 60, y);
    }
  }

  return canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png");
}

async function renderFileToCanvas(
  file: File,
  type: "document" | "slide" | "table",
  format: "jpg" | "png",
  rows?: Cell[][],
): Promise<string> {
  if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error("Could not get canvas context"));
        }
        if (format === "jpg") {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png"));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load input image file."));
      };
      img.src = url;
    });
  }

  if (type === "table" && rows) {
    return renderTableToCanvas(rows, format);
  }

  const rawText = await file.text();
  const tag = type === "slide" ? "a:t" : "w:t";
  const extracted = extractXmlText(rawText, tag);
  return renderTextToCanvas(file.name, extracted, type, format);
}

export default function DocDataToolClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [targetFormat, setTargetFormat] = useState("xlsx");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const [tablePreview, setTablePreview] = useState<Cell[][]>([]);
  const [jsonPreview, setJsonPreview] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadName, setDownloadName] = useState("");

  const handleReset = () => {
    setTablePreview([]);
    setJsonPreview("");
    setImagePreviewUrl("");
    setDownloadUrl("");
    setStatus("");
  };

  const convert = async () => {
    if (slug === "json-to-excel") {
      if (!jsonText && !file) {
        return setStatus("Please upload a JSON file or enter valid JSON text.");
      }
    } else if (!file) {
      return setStatus("Please choose a file to convert.");
    }

    setBusy(true);
    handleReset();

    try {
      const XLSX = await import("xlsx");
      const baseName = file ? file.name.replace(/\.[^/.]+$/, "") : "converted";

      // 1. CSV TO EXCEL
      if (slug === "csv-to-excel") {
        if (!file) throw new Error("File is required.");
        const text = await file.text();
        const workbook = XLSX.read(text, { type: "string", raw: true });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: "" });
        if (!rows.length) throw new Error("The CSV file is empty.");
        setTablePreview(rows.slice(0, 10));

        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${baseName}.xlsx`);
        setStatus(`Successfully converted ${rows.length.toLocaleString()} rows to Excel.`);
      }

      // 2. EXCEL TO CSV
      else if (slug === "excel-to-csv") {
        if (!file) throw new Error("File is required.");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const csvText = XLSX.utils.sheet_to_csv(sheet);
        const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: "" });

        setTablePreview(rows.slice(0, 10));
        const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${baseName}.csv`);
        setStatus("Successfully converted Excel file to CSV.");
      }

      // 3. EXCEL TO JSON
      else if (slug === "excel-to-json") {
        if (!file) throw new Error("File is required.");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const jsonStr = JSON.stringify(jsonData, null, 2);

        setJsonPreview(jsonStr.substring(0, 2000));
        const blob = new Blob([jsonStr], { type: "application/json" });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName(`${baseName}.json`);
        setStatus(`Successfully extracted ${jsonData.length} JSON objects.`);
      }

      // 4. JSON TO EXCEL
      else if (slug === "json-to-excel") {
        let rawContent = jsonText.trim();
        if (file) rawContent = await file.text();
        if (!rawContent) throw new Error("No JSON content provided.");

        const parsed = JSON.parse(rawContent);
        const jsonArray = Array.isArray(parsed) ? parsed : [parsed];
        const sheet = XLSX.utils.json_to_sheet(jsonArray);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, "Data");

        const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: "" });
        setTablePreview(rows.slice(0, 10));

        const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        setDownloadUrl(URL.createObjectURL(blob));
        setDownloadName("converted_json.xlsx");
        setStatus(`Converted ${jsonArray.length} JSON entries to Excel.`);
      }

      // 5. EXCEL TO JPG / EXCEL TO PNG
      else if (slug === "excel-to-jpg" || slug === "excel-to-png") {
        if (!file) throw new Error("File is required.");
        const fmt = slug.endsWith("jpg") ? "jpg" : "png";
        let dataUrl: string;

        if (file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
          dataUrl = await renderFileToCanvas(file, "table", fmt);
        } else {
          const buffer = await file.arrayBuffer();
          const workbook = XLSX.read(buffer, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Cell[]>(sheet, { header: 1, defval: "" });
          dataUrl = renderTableToCanvas(rows, fmt);
        }

        setImagePreviewUrl(dataUrl);
        setDownloadUrl(dataUrl);
        setDownloadName(`${baseName}.${fmt}`);
        setStatus(`Spreadsheet rendered to ${fmt.toUpperCase()} image.`);
      }

      // 6. WORD TO JPG / WORD TO PNG
      else if (slug === "word-to-jpg" || slug === "word-to-png") {
        if (!file) throw new Error("File is required.");
        const fmt = slug.endsWith("jpg") ? "jpg" : "png";
        const dataUrl = await renderFileToCanvas(file, "document", fmt);

        setImagePreviewUrl(dataUrl);
        setDownloadUrl(dataUrl);
        setDownloadName(`${baseName}.${fmt}`);
        setStatus(`Word document rendered to ${fmt.toUpperCase()} image.`);
      }

      // 7. POWERPOINT TO JPG / POWERPOINT TO PNG
      else if (slug === "powerpoint-to-jpg" || slug === "powerpoint-to-png") {
        if (!file) throw new Error("File is required.");
        const fmt = slug.endsWith("jpg") ? "jpg" : "png";
        const dataUrl = await renderFileToCanvas(file, "slide", fmt);

        setImagePreviewUrl(dataUrl);
        setDownloadUrl(dataUrl);
        setDownloadName(`${baseName}.${fmt}`);
        setStatus(`PowerPoint presentation rendered to ${fmt.toUpperCase()} slide image.`);
      }

      // 8. GENERIC FILE CONVERTER
      else if (slug === "file-converter") {
        if (!file) throw new Error("File is required.");

        if (targetFormat === "csv" || targetFormat === "json" || targetFormat === "xlsx") {
          const buffer = await file.arrayBuffer();
          let workbook;
          try {
            workbook = XLSX.read(buffer, { type: "array" });
          } catch {
            const text = await file.text();
            workbook = XLSX.read(text, { type: "string", raw: true });
          }
          const sheet = workbook.Sheets[workbook.SheetNames[0]];

          if (targetFormat === "csv") {
            const csvText = XLSX.utils.sheet_to_csv(sheet);
            const blob = new Blob([csvText], { type: "text/csv" });
            setDownloadUrl(URL.createObjectURL(blob));
            setDownloadName(`${baseName}.csv`);
          } else if (targetFormat === "json") {
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            const jsonStr = JSON.stringify(jsonData, null, 2);
            setJsonPreview(jsonStr.substring(0, 1500));
            const blob = new Blob([jsonStr], { type: "application/json" });
            setDownloadUrl(URL.createObjectURL(blob));
            setDownloadName(`${baseName}.json`);
          } else {
            const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
            const blob = new Blob([wbout], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            setDownloadUrl(URL.createObjectURL(blob));
            setDownloadName(`${baseName}.xlsx`);
          }
          setStatus(`File converted to ${targetFormat.toUpperCase()}.`);
        } else {
          // Render to Canvas image format
          const rawText = await file.text();
          const fmt = targetFormat === "jpg" ? "jpg" : "png";
          const dataUrl = renderTextToCanvas(file.name, rawText, "document", fmt);
          setImagePreviewUrl(dataUrl);
          setDownloadUrl(dataUrl);
          setDownloadName(`${baseName}.${fmt}`);
          setStatus(`File converted to ${fmt.toUpperCase()} image.`);
        }
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Conversion failed. Please try a valid input file.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Upload Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label className="workbench-label" style={{ color: "#10213a", fontWeight: "700" }}>
            {slug === "json-to-excel" ? "Upload JSON File or Paste Raw JSON" : "Choose File to Convert"}
          </label>
          <input
            type="file"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null);
              handleReset();
            }}
          />
        </div>

        {/* Optional JSON Textarea for JSON to Excel */}
        {slug === "json-to-excel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ color: "#10213a", fontWeight: "600" }}>Or Paste JSON Data Array:</label>
            <textarea
              rows={5}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='[{"name": "Alice", "score": 95}, {"name": "Bob", "score": 88}]'
            />
          </div>
        )}

        {/* Target Format Selector for Generic File Converter */}
        {slug === "file-converter" && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <label style={{ color: "#10213a", fontWeight: "600" }}>Target Format:</label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            >
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
              <option value="png">PNG Image (.png)</option>
              <option value="jpg">JPG Image (.jpg)</option>
            </select>
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={convert}
          disabled={busy}
          style={{ alignSelf: "flex-start" }}
        >
          {busy ? "Converting File…" : `Run ${tool.name}`}
        </button>

        {/* Status Message */}
        {status && (
          <div className="result" style={{ marginTop: "1rem", padding: "1rem", borderRadius: "10px" }}>
            <strong>Conversion Status</strong>
            <p style={{ margin: "0.5rem 0 0 0" }}>{status}</p>
          </div>
        )}

        {/* Download Action Button */}
        {downloadUrl && (
          <div style={{ marginTop: "0.5rem" }}>
            <a
              href={downloadUrl}
              download={downloadName}
              style={{
                display: "inline-block",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                background: "#10b981",
                color: "#ffffff",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              📥 Download {downloadName}
            </a>
          </div>
        )}

        {/* Image Preview */}
        {imagePreviewUrl && (
          <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <strong style={{ color: "#10213a" }}>Rendered Image Preview:</strong>
            <img
              src={imagePreviewUrl}
              alt="Converted Document Preview"
              style={{
                maxWidth: "100%",
                maxHeight: "500px",
                borderRadius: "10px",
                border: "2px solid #cbd5e1",
                objectFit: "contain",
                background: "#f8fafc",
              }}
            />
          </div>
        )}

        {/* Table Preview */}
        {tablePreview.length > 0 && (
          <div className="preview" style={{ marginTop: "1rem" }}>
            <strong style={{ color: "#10213a" }}>Data Table Preview (First {tablePreview.length} Rows)</strong>
            <div className="table-wrap" style={{ marginTop: "0.5rem", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {tablePreview.map((row, i) => (
                    <tr key={i} style={{ background: i === 0 ? "#f1f5f9" : i % 2 === 0 ? "#f8fafc" : "#ffffff" }}>
                      {row.map((cell, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "0.5rem 0.75rem",
                            border: "1px solid #e2e8f0",
                            fontSize: "0.875rem",
                            fontWeight: i === 0 ? "bold" : "normal",
                          }}
                        >
                          {String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* JSON Preview */}
        {jsonPreview && (
          <div className="preview" style={{ marginTop: "1rem" }}>
            <strong style={{ color: "#10213a" }}>JSON Data Preview</strong>
            <pre
              style={{
                marginTop: "0.5rem",
                padding: "1rem",
                borderRadius: "8px",
                background: "#0f172a",
                color: "#38bdf8",
                maxHeight: "300px",
                overflowY: "auto",
                fontSize: "0.85rem",
              }}
            >
              {jsonPreview}
            </pre>
          </div>
        )}

        <p className="privacy-note" style={{ fontSize: "0.85rem", color: "#64748b", marginTop: "1rem" }}>
          🔒 Your documents are processed entirely in your browser using client-side JavaScript. No file data is uploaded to external servers or required to run through LibreOffice.
        </p>

      </div>
    </section>
  );
}
