"use client";

import { useState, useEffect } from "react";
import type { Tool } from "../../lib/catalog";

export default function PdfToolClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  const [files, setFiles] = useState<File[]>([]);
  const [pages, setPages] = useState("1");
  const [rotationAngle, setRotationAngle] = useState(90);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [password, setPassword] = useState("");
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [inputPreviewUrl, setInputPreviewUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  // Create real-time live preview URL when input files change
  useEffect(() => {
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setInputPreviewUrl(url);

      // Inspect page count
      (async () => {
        try {
          const { PDFDocument } = await import("pdf-lib");
          const pdfDoc = await PDFDocument.load(await files[0].arrayBuffer());
          setTotalPages(pdfDoc.getPageCount());
        } catch (e) { }
      })();

      return () => URL.revokeObjectURL(url);
    } else {
      setInputPreviewUrl("");
      setTotalPages(null);
    }
  }, [files]);

  const moveFile = (index: number, direction: -1 | 1) => {
    const destination = index + direction;
    if (destination < 0 || destination >= files.length) return;
    const reordered = [...files];
    [reordered[index], reordered[destination]] = [
      reordered[destination],
      reordered[index],
    ];
    setFiles(reordered);
  };

  const run = async () => {
    if (!files.length) return setResult("Upload at least one PDF file first.");
    setBusy(true);
    setResult("");

    try {
      const { PDFDocument, degrees, rgb, StandardFonts } = await import("pdf-lib");
      const output = await PDFDocument.create();

      if (slug === "merge-pdf") {
        for (const file of files) {
          const source = await PDFDocument.load(await file.arrayBuffer());
          const copied = await output.copyPages(source, source.getPageIndices());
          copied.forEach((page) => output.addPage(page));
        }
      } else {
        const source = await PDFDocument.load(await files[0].arrayBuffer());
        const count = source.getPageCount();
        setTotalPages(count);

        if (slug === "pdf-page-counter") {
          setResult(`Total Pages in PDF: ${count} pages`);
          return;
        }

        if (slug.includes("metadata")) {
          const title = source.getTitle() || "Untitled Document";
          const author = source.getAuthor() || "Unknown Author";
          setResult(`Title: ${title}\nAuthor: ${author}\nTotal Pages: ${count}`);
          return;
        }

        // Parse pages
        const requested = pages
          .split(",")
          .map((v) => Number(v.trim()) - 1)
          .filter((v) => Number.isInteger(v) && v >= 0 && v < count);

        const chosenIndices = (slug.includes("extract") || slug.includes("split") || slug.includes("delete")) && requested.length
          ? requested
          : source.getPageIndices();

        const copiedPages = await output.copyPages(source, chosenIndices);
        const font = await output.embedFont(StandardFonts.HelveticaBold);

        copiedPages.forEach((page) => {
          if (slug.includes("rotate")) {
            page.setRotation(degrees(rotationAngle));
          }

          if (slug.includes("watermark") && watermarkText.trim()) {
            const { width, height } = page.getSize();
            page.drawText(watermarkText, {
              x: width / 4,
              y: height / 2,
              size: 42,
              font,
              color: rgb(0.75, 0.75, 0.75),
              opacity: 0.4,
              rotate: degrees(45),
            });
          }

          output.addPage(page);
        });
      }

      const bytes = await output.save();
      const outputBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;

      const url = URL.createObjectURL(
        new Blob([outputBuffer], { type: "application/pdf" })
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setResult("PDF processed successfully. Review preview and download.");
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Could not process PDF.");
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
            Upload PDF {slug === "merge-pdf" ? "Files (Multiple Allowed)" : "File"}
          </label>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple={slug === "merge-pdf"}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </div>

        {/* Selected Files Order / Info */}
        {files.length > 0 && (
          <div className="file-order" style={{ padding: "1rem", borderRadius: "10px", background: "#f8fafc", border: "1px solid #cbd5e1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", color: "#10213a", fontWeight: "bold" }}>
              <span>{slug === "merge-pdf" ? "Merge Sequence Order:" : `Selected File: ${files[0].name}`}</span>
              {totalPages !== null && <span>Total Pages: {totalPages}</span>}
            </div>

            {files.map((file, index) => (
              <div className="file-order-row" key={`${file.name}-${index}`} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0" }}>
                <span style={{ fontSize: "0.9rem" }}>{index + 1}. {file.name}</span>
                {slug === "merge-pdf" && (
                  <div>
                    <button className="icon-button" type="button" onClick={() => moveFile(index, -1)} disabled={index === 0}>
                      ↑
                    </button>
                    <button className="icon-button" type="button" onClick={() => moveFile(index, 1)} disabled={index === files.length - 1}>
                      ↓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* REAL-TIME LIVE UPLOADED PDF PREVIEW PLAYER */}
        {inputPreviewUrl && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ color: "#10213a", fontWeight: "700" }}>Live Input PDF Preview:</label>
            <iframe
              src={inputPreviewUrl}
              title="Input PDF Live Preview"
              style={{
                width: "100%",
                height: "380px",
                borderRadius: "10px",
                border: "2px solid #cbd5e1",
                background: "#ffffff",
              }}
            />
          </div>
        )}

        {/* TOOL PARAMETERS */}
        {/(split|extract|delete|remove)/.test(slug) && (
          <label style={{ color: "#10213a", fontWeight: "600" }}>
            Page Numbers (e.g. 1, 2, 5 or 1-3)
            <input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="e.g. 1, 3, 5" />
          </label>
        )}

        {slug.includes("rotate") && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <label style={{ color: "#10213a", fontWeight: "600" }}>Rotation Angle:</label>
            {[90, 180, 270].map((angle) => (
              <button
                key={angle}
                type="button"
                className={rotationAngle === angle ? "" : "secondary"}
                onClick={() => setRotationAngle(angle)}
              >
                ↻ {angle}°
              </button>
            ))}
          </div>
        )}

        {slug.includes("watermark") && (
          <label style={{ color: "#10213a", fontWeight: "600" }}>
            Watermark Text Overlay
            <input value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="CONFIDENTIAL" />
          </label>
        )}

        {/* Process Action Button */}
        <button type="button" onClick={run} disabled={busy} style={{ alignSelf: "flex-start" }}>
          {busy ? "Processing PDF..." : `Run ${tool.name}`}
        </button>

        {/* PROCESSED PDF PREVIEW & RESULT CARD */}
        {result && (
          <div className="result" style={{ marginTop: "1.25rem", padding: "1.25rem", borderRadius: "12px" }}>
            <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Result Status</strong>
            <p style={{ margin: "0.5rem 0 1rem 0", fontWeight: "500" }}>{result}</p>

            {previewUrl && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <iframe
                  className="pdf-preview"
                  src={previewUrl}
                  title="Processed Output PDF Preview"
                  style={{ width: "100%", height: "450px", borderRadius: "8px", border: "1px solid #334155" }}
                />
                <button
                  className="secondary"
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = previewUrl;
                    link.download = `${slug}-output.pdf`;
                    link.click();
                  }}
                  style={{ alignSelf: "flex-start", background: "#10b981", color: "#fff", fontWeight: "bold" }}
                >
                  📥 Download Processed PDF
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
