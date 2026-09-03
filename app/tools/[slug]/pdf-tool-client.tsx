"use client";

import { useState, useEffect } from "react";
import type { Tool } from "../../lib/catalog";

function getAcceptFilter(slug: string): string {
  if (slug === "html-to-pdf" || slug === "webpage-to-pdf")
    return ".html,.htm,.txt,text/html,text/plain";
  if (slug === "csv-to-pdf") return ".csv,text/csv";
  if (slug === "xml-to-pdf") return ".xml,text/xml";
  if (slug === "excel-to-pdf") return ".xlsx,.xls,.csv,text/csv";
  if (slug === "word-to-pdf") return ".docx,.doc,.txt";
  if (slug === "powerpoint-to-pdf") return ".pptx,.ppt";
  if (slug === "email-to-pdf") return ".eml,.msg,.txt";
  if (/(jpg|png|webp|heic|image)-to-pdf/.test(slug)) return "image/*";
  return "application/pdf,.pdf";
}

function getUploadLabel(slug: string): string {
  if (slug === "html-to-pdf" || slug === "webpage-to-pdf")
    return "Upload HTML File or Enter HTML Code Below";
  if (slug === "csv-to-pdf") return "Upload CSV File";
  if (slug === "xml-to-pdf") return "Upload XML File";
  if (slug === "excel-to-pdf") return "Upload Excel File (.xlsx, .csv)";
  if (slug === "word-to-pdf") return "Upload Word Document (.docx)";
  if (slug === "powerpoint-to-pdf") return "Upload PowerPoint Presentation (.pptx)";
  if (slug === "email-to-pdf") return "Upload Email File (.eml)";
  if (/(jpg|png|webp|heic|image)-to-pdf/.test(slug)) return "Upload Image File";
  if (slug === "merge-pdf") return "Upload PDF Files (Multiple Allowed)";
  return "Upload PDF File";
}

// Convert image file to PNG ArrayBuffer for pdf-lib embedding
function convertImageToPngBuffer(file: File): Promise<ArrayBuffer> {
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
        return reject(new Error("Canvas context unavailable."));
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Failed to convert image to PNG blob."));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, "image/png");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image file."));
    };
    img.src = url;
  });
}

// Full-Style HTML Renderer preserving all CSS rules, background colors, custom fonts, borders, cards & layout
async function renderStyledHtmlToPdfPages(
  outputPdf: any,
  htmlContent: string,
  width = 794,
  pageHeight = 1123,
): Promise<boolean> {
  if (typeof document === "undefined") return false;

  try {
    const isFullDoc = /<html|<body|<head/i.test(htmlContent);
    const bodyContent = isFullDoc
      ? htmlContent
      : `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: #ffffff; color: #0f172a; }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `;

    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${pageHeight * 3}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;">
            ${bodyContent}
          </div>
        </foreignObject>
      </svg>
    `;

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();

    const masterCanvas = await new Promise<HTMLCanvasElement>((resolve, reject) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = Math.max(pageHeight, img.height || pageHeight);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(new Error("Canvas context failed"));
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        resolve(canvas);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("SVG load failed"));
      };
      img.src = url;
    });

    // Slice master canvas into standard A4 PDF pages (794 x 1123)
    const pageCount = Math.max(1, Math.ceil(masterCanvas.height / pageHeight));

    for (let p = 0; p < pageCount; p++) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = width;
      pageCanvas.height = pageHeight;
      const pageCtx = pageCanvas.getContext("2d");
      if (!pageCtx) continue;

      pageCtx.fillStyle = "#ffffff";
      pageCtx.fillRect(0, 0, width, pageHeight);

      const srcY = p * pageHeight;
      const srcH = Math.min(pageHeight, masterCanvas.height - srcY);
      if (srcH > 0) {
        pageCtx.drawImage(masterCanvas, 0, srcY, width, srcH, 0, 0, width, srcH);
      }

      const blob = await new Promise<Blob>((res) => pageCanvas.toBlob((b) => res(b!), "image/png"));
      const embedded = await outputPdf.embedPng(await blob.arrayBuffer());
      const page = outputPdf.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    }

    return true;
  } catch {
    return false;
  }
}

// Fallback Helper to parse HTML / text into clean structured elements (Headings, Paragraphs, List items)
function parseContentToElements(rawContent: string): {
  docTitle: string;
  items: Array<{ type: "h1" | "h2" | "p" | "li"; text: string }>;
} {
  if (typeof DOMParser !== "undefined") {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawContent, "text/html");

      doc.querySelectorAll("style, script, noscript, svg").forEach((node) => node.remove());

      const docTitle =
        doc.querySelector("title")?.textContent?.trim() ||
        doc.querySelector("h1")?.textContent?.trim() ||
        "Document";

      const items: Array<{ type: "h1" | "h2" | "p" | "li"; text: string }> = [];

      const nodes = doc.body.querySelectorAll("h1, h2, h3, h4, p, li, td, th, div");
      if (nodes.length > 0) {
        nodes.forEach((node) => {
          if (node.querySelector("h1, h2, h3, h4, p, li, div")) return;
          const text = node.textContent?.trim();
          if (!text) return;

          const tag = node.tagName.toLowerCase();
          if (tag === "h1") items.push({ type: "h1", text });
          else if (tag === "h2" || tag === "h3" || tag === "h4") items.push({ type: "h2", text });
          else if (tag === "li") items.push({ type: "li", text });
          else items.push({ type: "p", text });
        });
      }

      if (items.length > 0) {
        return { docTitle, items };
      }
    } catch {}
  }

  const cleanStr = rawContent
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lines = cleanStr.split("\n").filter((l) => l.trim());
  const items: Array<{ type: "h1" | "h2" | "p" | "li"; text: string }> = lines.map((line) => ({
    type: "p",
    text: line.trim(),
  }));

  return { docTitle: "Document", items: items.length > 0 ? items : [{ type: "p", text: cleanStr }] };
}

// Structured Fallback PDF Page Generator
async function addStructuredPagesToPdf(
  outputPdf: any,
  title: string,
  rawContent: string,
  isSlide: boolean,
) {
  // First attempt full CSS styled HTML render if rawContent contains HTML tags
  if (/<[a-z][\s\S]*>/i.test(rawContent) && !isSlide) {
    const success = await renderStyledHtmlToPdfPages(outputPdf, rawContent);
    if (success) return;
  }

  const { docTitle, items } = parseContentToElements(rawContent);
  const displayTitle = title || docTitle;

  if (isSlide) {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 540;
    const ctx = canvas.getContext("2d")!;

    const gradient = ctx.createLinearGradient(0, 0, 960, 540);
    gradient.addColorStop(0, "#0f172a");
    gradient.addColorStop(1, "#1e293b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);

    ctx.fillStyle = "#ffffff";
    if (typeof ctx.roundRect === "function") ctx.roundRect(40, 40, 880, 460, 16);
    else ctx.fillRect(40, 40, 880, 460);
    ctx.fill();

    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(40, 40, 880, 12);

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 28px Inter, sans-serif";
    ctx.fillText(displayTitle.substring(0, 50), 70, 100);

    ctx.fillStyle = "#334155";
    ctx.font = "18px Inter, sans-serif";

    const lines = items.map((it) => it.text).slice(0, 8);
    lines.forEach((line, idx) => {
      ctx.fillText(`• ${line.substring(0, 75)}`, 80, 160 + idx * 36);
    });

    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
    const embedded = await outputPdf.embedPng(await blob.arrayBuffer());
    const page = outputPdf.addPage([embedded.width, embedded.height]);
    page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
    return;
  }

  // Multi-page Document Rendering (A4 standard: 750 x 1000)
  let currentPageIndex = 1;

  function createPageCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 750;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 750, 1000);

    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 742, 992);

    ctx.fillStyle = "#1e293b";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.fillText(displayTitle.substring(0, 45), 50, 55);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 70);
    ctx.lineTo(700, 70);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px Inter, sans-serif";
    ctx.fillText(`Page ${currentPageIndex}`, 650, 975);

    return { canvas, ctx, currentY: 105 };
  }

  let { canvas, ctx, currentY } = createPageCanvas();

  for (const item of items) {
    let fontStyle = "15px Inter, sans-serif";
    let color = "#334155";
    let lineHeight = 24;
    let prefix = "";

    if (item.type === "h1") {
      fontStyle = "bold 22px Inter, sans-serif";
      color = "#0f172a";
      lineHeight = 32;
      currentY += 12;
    } else if (item.type === "h2") {
      fontStyle = "bold 17px Inter, sans-serif";
      color = "#1e293b";
      lineHeight = 28;
      currentY += 8;
    } else if (item.type === "li") {
      prefix = "• ";
    }

    ctx.font = fontStyle;
    ctx.fillStyle = color;

    const words = (prefix + item.text).split(" ");
    let line = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      if (ctx.measureText(testLine).width > 630) {
        if (currentY > 920) {
          const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
          const embedded = await outputPdf.embedPng(await blob.arrayBuffer());
          const page = outputPdf.addPage([embedded.width, embedded.height]);
          page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });

          currentPageIndex++;
          const newPage = createPageCanvas();
          canvas = newPage.canvas;
          ctx = newPage.ctx;
          currentY = newPage.currentY;
          ctx.font = fontStyle;
          ctx.fillStyle = color;
        }

        ctx.fillText(line, 50, currentY);
        line = words[i] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }

    if (line) {
      if (currentY > 920) {
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
        const embedded = await outputPdf.embedPng(await blob.arrayBuffer());
        const page = outputPdf.addPage([embedded.width, embedded.height]);
        page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });

        currentPageIndex++;
        const newPage = createPageCanvas();
        canvas = newPage.canvas;
        ctx = newPage.ctx;
        currentY = newPage.currentY;
        ctx.font = fontStyle;
        ctx.fillStyle = color;
      }

      ctx.fillText(line, 50, currentY);
      currentY += lineHeight + 6;
    }
  }

  const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"));
  const embedded = await outputPdf.embedPng(await blob.arrayBuffer());
  const page = outputPdf.addPage([embedded.width, embedded.height]);
  page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
}

export default function PdfToolClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  const [files, setFiles] = useState<File[]>([]);
  const [htmlCode, setHtmlCode] = useState("");
  const [pages, setPages] = useState("1");
  const [rotationAngle, setRotationAngle] = useState(90);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [inputPreviewUrl, setInputPreviewUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  const isNonPdfToPdf = slug.endsWith("-to-pdf") && slug !== "pdf-to-pdf-a";

  useEffect(() => {
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setInputPreviewUrl(url);

      if (files[0].type === "application/pdf" || files[0].name.endsWith(".pdf")) {
        (async () => {
          try {
            const { PDFDocument } = await import("pdf-lib");
            const pdfDoc = await PDFDocument.load(await files[0].arrayBuffer());
            setTotalPages(pdfDoc.getPageCount());
          } catch (e) {}
        })();
      } else {
        setTotalPages(null);
      }

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
    if (isNonPdfToPdf) {
      if (slug === "html-to-pdf" || slug === "webpage-to-pdf") {
        if (!files.length && !htmlCode.trim()) {
          return setResult("Please upload an HTML file or enter HTML code in the text box.");
        }
      } else if (!files.length) {
        return setResult("Please upload a file to convert to PDF.");
      }
    } else if (!files.length) {
      return setResult("Upload at least one PDF file first.");
    }

    setBusy(true);
    setResult("");

    try {
      const { PDFDocument, degrees, rgb, StandardFonts } = await import("pdf-lib");
      const output = await PDFDocument.create();

      if (isNonPdfToPdf) {
        const firstFile = files[0];

        // 1. IMAGE TO PDF
        if (/(jpg|png|webp|heic|image)-to-pdf/.test(slug)) {
          let pngBuffer: ArrayBuffer;
          if (firstFile.type === "image/png" || firstFile.name.endsWith(".png")) {
            pngBuffer = await firstFile.arrayBuffer();
          } else {
            pngBuffer = await convertImageToPngBuffer(firstFile);
          }
          const embeddedImage = await output.embedPng(pngBuffer);
          const page = output.addPage([embeddedImage.width, embeddedImage.height]);
          page.drawImage(embeddedImage, {
            x: 0,
            y: 0,
            width: embeddedImage.width,
            height: embeddedImage.height,
          });
        }
        // 2. HTML / WEBPAGE TO PDF
        else if (slug === "html-to-pdf" || slug === "webpage-to-pdf") {
          let textContent = htmlCode.trim();
          if (firstFile) textContent = await firstFile.text();
          if (!textContent) throw new Error("No HTML content provided.");

          await addStructuredPagesToPdf(
            output,
            firstFile ? firstFile.name : "HTML Document",
            textContent,
            false,
          );
        }
        // 3. EXCEL / CSV / XML / WORD / PPTX / EMAIL TO PDF
        else {
          let textContent = "";
          if (firstFile && firstFile.type.startsWith("image/")) {
            const pngBuffer = await convertImageToPngBuffer(firstFile);
            const embeddedImage = await output.embedPng(pngBuffer);
            const page = output.addPage([embeddedImage.width, embeddedImage.height]);
            page.drawImage(embeddedImage, {
              x: 0,
              y: 0,
              width: embeddedImage.width,
              height: embeddedImage.height,
            });
          } else {
            if (slug.includes("excel") || slug.includes("csv")) {
              const XLSX = await import("xlsx");
              let workbook;
              try {
                workbook = XLSX.read(await firstFile.arrayBuffer(), { type: "array" });
              } catch {
                workbook = XLSX.read(await firstFile.text(), { type: "string", raw: true });
              }
              const sheet = workbook.Sheets[workbook.SheetNames[0]];
              textContent = XLSX.utils.sheet_to_csv(sheet);
            } else {
              textContent = await firstFile.text();
            }

            const isSlide = slug.includes("powerpoint");
            await addStructuredPagesToPdf(
              output,
              firstFile ? firstFile.name : "Document",
              textContent,
              isSlide,
            );
          }
        }
      }
      // STANDARD PDF FILE WORKFLOWS
      else if (slug === "merge-pdf") {
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

        const requested = pages
          .split(",")
          .map((v) => Number(v.trim()) - 1)
          .filter((v) => Number.isInteger(v) && v >= 0 && v < count);

        const chosenIndices =
          (slug.includes("extract") || slug.includes("split") || slug.includes("delete")) &&
          requested.length
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
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer;

      const url = URL.createObjectURL(
        new Blob([outputBuffer], { type: "application/pdf" }),
      );
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      setResult("PDF created successfully. Review preview and download.");
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Could not process document.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        
        {/* File Upload Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label className="workbench-label" style={{ color: "#10213a", fontWeight: "700" }}>
            {getUploadLabel(slug)}
          </label>
          <input
            type="file"
            accept={getAcceptFilter(slug)}
            multiple={slug === "merge-pdf"}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </div>

        {/* Text Input for HTML to PDF / Webpage to PDF */}
        {(slug === "html-to-pdf" || slug === "webpage-to-pdf") && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ color: "#10213a", fontWeight: "600" }}>
              Or Paste HTML / Webpage Source Code:
            </label>
            <textarea
              rows={6}
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="<h1>My Document Title</h1><p>Enter document paragraph content here...</p>"
              style={{
                fontFamily: "monospace",
                fontSize: "0.9rem",
                padding: "0.75rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
              }}
            />
          </div>
        )}

        {/* Selected Files Order / Info */}
        {files.length > 0 && (
          <div
            className="file-order"
            style={{
              padding: "1rem",
              borderRadius: "10px",
              background: "#f8fafc",
              border: "1px solid #cbd5e1",
            }}
          >
            <div
              style={{
                display: "flex",
                justify: "space-between",
                marginBottom: "0.5rem",
                color: "#10213a",
                fontWeight: "bold",
              }}
            >
              <span>
                {slug === "merge-pdf"
                  ? "Merge Sequence Order:"
                  : `Selected File: ${files[0].name}`}
              </span>
              {totalPages !== null && <span>Total Pages: {totalPages}</span>}
            </div>

            {files.map((file, index) => (
              <div
                className="file-order-row"
                key={`${file.name}-${index}`}
                style={{
                  display: "flex",
                  justify: "space-between",
                  padding: "0.4rem 0",
                }}
              >
                <span style={{ fontSize: "0.9rem" }}>
                  {index + 1}. {file.name}
                </span>
                {slug === "merge-pdf" && (
                  <div>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => moveFile(index, -1)}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => moveFile(index, 1)}
                      disabled={index === files.length - 1}
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* REAL-TIME LIVE UPLOADED PDF PREVIEW PLAYER */}
        {inputPreviewUrl && (files[0]?.type === "application/pdf" || files[0]?.name.endsWith(".pdf")) && (
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
            <input
              value={pages}
              onChange={(e) => setPages(e.target.value)}
              placeholder="e.g. 1, 3, 5"
            />
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
            <input
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="CONFIDENTIAL"
            />
          </label>
        )}

        {/* Process Action Button */}
        <button
          type="button"
          onClick={run}
          disabled={busy}
          style={{ alignSelf: "flex-start" }}
        >
          {busy ? "Generating PDF..." : `Run ${tool.name}`}
        </button>

        {/* PROCESSED PDF PREVIEW & RESULT CARD */}
        {result && (
          <div
            className="result"
            style={{ marginTop: "1.25rem", padding: "1.25rem", borderRadius: "12px" }}
          >
            <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>
              Result Status
            </strong>
            <p style={{ margin: "0.5rem 0 1rem 0", fontWeight: "500" }}>{result}</p>

            {previewUrl && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <iframe
                  className="pdf-preview"
                  src={previewUrl}
                  title="Processed Output PDF Preview"
                  style={{
                    width: "100%",
                    height: "450px",
                    borderRadius: "8px",
                    border: "1px solid #334155",
                  }}
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
                  style={{
                    alignSelf: "flex-start",
                    background: "#10b981",
                    color: "#fff",
                    fontWeight: "bold",
                  }}
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
