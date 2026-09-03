"use client";

import { useState, useRef, useEffect } from "react";
import type { Tool } from "../../lib/catalog";

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 Bytes";
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageToolClient({ tool }: { tool: Tool }) {
  const slug = tool.slug;

  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  // Resizing / Preset States
  const [targetWidth, setTargetWidth] = useState<number>(800);
  const [targetHeight, setTargetHeight] = useState<number>(600);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<number>(4 / 3);

  // Rotation & Flip States
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Quality & Target KB States
  const [quality, setQuality] = useState<number>(80);
  const [targetKb, setTargetKb] = useState<number>(50);

  // Format Converter State
  const [targetFormat, setTargetFormat] = useState<"image/jpeg" | "image/png" | "image/webp">("image/jpeg");

  // Color Picker Eyedropper State
  const [pickedColor, setPickedColor] = useState<{ hex: string; rgb: string } | null>(null);

  // Result States
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string>("");
  const [base64Output, setBase64Output] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Detect Target KB from slug if preset (e.g. compress-image-to-50kb)
  useEffect(() => {
    const match = slug.match(/compress-image-to-(\d+)(kb|mb)/);
    if (match) {
      const num = Number(match[1]);
      const unit = match[2];
      setTargetKb(unit === "mb" ? num * 1024 : num);
    }

    if (slug === "passport-size-photo-maker") {
      setTargetWidth(413);
      setTargetHeight(531);
    } else if (slug.includes("signature")) {
      setTargetWidth(300);
      setTargetHeight(150);
    }
  }, [slug]);

  // Load image when file changes
  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setResultBlob(null);
    setResultUrl("");
    setBase64Output("");
    setPickedColor(null);
    setStatus("");

    const url = URL.createObjectURL(selectedFile);
    setImgSrc(url);

    const img = new Image();
    img.onload = () => {
      setImgDimensions({ width: img.width, height: img.height });
      setTargetWidth(img.width);
      setTargetHeight(img.height);
      setAspectRatio(img.width / img.height);
    };
    img.src = url;
  };

  // Eyedropper Color Picker Click Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

    setPickedColor({ hex, rgb: `rgb(${r}, ${g}, ${b})` });
  };

  // Main Image Processor (Compression / Scaling / Rotation / Format Conversion)
  const processImage = async () => {
    if (!file || !imgSrc) return setStatus("Upload an image file first.");
    setBusy(true);
    setStatus("");

    try {
      const img = new Image();
      img.src = imgSrc;
      await img.decode();

      const canvas = document.createElement("canvas");
      let w = targetWidth || img.width;
      let h = targetHeight || img.height;

      // Swap dimensions if rotated 90 or 270 degrees
      const isRotatedVertical = rotation === 90 || rotation === 270;
      canvas.width = isRotatedVertical ? h : w;
      canvas.height = isRotatedVertical ? w : h;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Browser canvas context failed.");

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      // Also render to visibleRef canvas for Eyedropper
      if (canvasRef.current) {
        canvasRef.current.width = canvas.width;
        canvasRef.current.height = canvas.height;
        const mainCtx = canvasRef.current.getContext("2d");
        if (mainCtx) mainCtx.drawImage(canvas, 0, 0);
      }

      // Base64 output if requested
      if (slug === "image-to-base64") {
        const b64 = canvas.toDataURL("image/jpeg");
        setBase64Output(b64);
        setStatus("Image converted to Base64 Data URL.");
        setBusy(false);
        return;
      }

      // Format determination
      let mimeType = targetFormat;
      if (slug.includes("png")) mimeType = "image/png";
      else if (slug.includes("webp")) mimeType = "image/webp";
      else if (slug.includes("jpg") || slug.includes("jpeg")) mimeType = "image/jpeg";

      // Target KB Compression (Binary Search Quality)
      let finalBlob: Blob | null = null;
      if (slug.includes("compress") || slug.includes("kb") || slug.includes("mb")) {
        let lowQ = 0.05;
        let highQ = 0.95;
        let bestBlob: Blob | null = null;

        for (let i = 0; i < 6; i++) {
          const midQ = (lowQ + highQ) / 2;
          const tempBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", midQ));
          if (tempBlob) {
            bestBlob = tempBlob;
            if (tempBlob.size / 1024 > targetKb) {
              highQ = midQ;
            } else {
              lowQ = midQ;
            }
          }
        }
        // If file size is already smaller than target KB limit and compressed blob is larger, keep original file
        if (bestBlob && bestBlob.size > file.size && file.size <= targetKb * 1024) {
          finalBlob = file;
        } else {
          finalBlob = bestBlob;
        }
      } else {
        finalBlob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mimeType, quality / 100));
      }

      if (!finalBlob) throw new Error("Image processing failed.");

      if (resultUrl) URL.revokeObjectURL(resultUrl);
      const url = URL.createObjectURL(finalBlob);
      setResultBlob(finalBlob);
      setResultUrl(url);

      setStatus(`Processed successfully! ${formatBytes(file.size)} ➔ ${formatBytes(finalBlob.size)}`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setBusy(false);
    }
  };

  // Auto-process on file load or control change
  useEffect(() => {
    if (file && imgSrc) {
      processImage();
    }
  }, [file, rotation, flipH, flipV, quality, targetWidth, targetHeight, targetFormat, targetKb]);

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Upload Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label className="workbench-label" htmlFor="image-file" style={{ color: "#10213a", fontWeight: "700" }}>
            Upload Image (JPG, PNG, WEBP, SVG)
          </label>
          <input
            id="image-file"
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />
        </div>

        {/* Image Dimensions & Info */}
        {file && imgDimensions && (
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.9rem", color: "#64748b", fontWeight: "600" }}>
            <span>Original Size: <strong>{formatBytes(file.size)}</strong></span>
            <span>Dimensions: <strong>{imgDimensions.width} × {imgDimensions.height} px</strong></span>
            <span>Aspect Ratio: <strong>{(imgDimensions.width / imgDimensions.height).toFixed(2)}:1</strong></span>
          </div>
        )}

        {/* INTERACTIVE PREVIEW & EYEDROPPER CANVAS */}
        {imgSrc && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "0.5rem" }}>
            {/* Original Upload Image View */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ color: "#10213a", fontWeight: "700" }}>Original Image:</div>
              <div
                style={{
                  background: "#0f172a",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "240px",
                  border: "1px solid #334155",
                }}
              >
                <img
                  ref={imageRef}
                  src={imgSrc}
                  alt="Original Preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "320px",
                    borderRadius: "6px",
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                    transition: "transform 0.2s ease",
                  }}
                />
              </div>
            </div>

            {/* Live Processed / Canvas Interactive View */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ color: "#10213a", fontWeight: "700" }}>
                {slug === "image-color-picker" ? "Click Image Canvas to Pick Color:" : "Processed Result Preview:"}
              </div>
              <div
                style={{
                  background: "#0f172a",
                  padding: "0.75rem",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: "240px",
                  border: "1px solid #334155",
                }}
              >
                {slug === "image-color-picker" ? (
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{ maxWidth: "100%", maxHeight: "320px", cursor: "crosshair", borderRadius: "6px" }}
                  />
                ) : resultUrl ? (
                  <img src={resultUrl} alt="Processed Output" style={{ maxWidth: "100%", maxHeight: "320px", borderRadius: "6px" }} />
                ) : (
                  <span style={{ color: "#cbd5e1" }}>Processing preview...</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EYEDROPPER PICKED COLOR CARD */}
        {pickedColor && (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", padding: "1rem", background: "#1e293b", borderRadius: "10px", border: "1px solid #334155" }}>
            <div style={{ width: "45px", height: "45px", borderRadius: "8px", background: pickedColor.hex, border: "2px solid #fff" }} />
            <div>
              <div style={{ color: "#cbd5e1", fontSize: "0.85rem" }}>Selected Color:</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#38bdf8", fontFamily: "monospace" }}>
                {pickedColor.hex} ({pickedColor.rgb})
              </div>
            </div>
            <button
              type="button"
              className="secondary"
              onClick={() => navigator.clipboard.writeText(pickedColor.hex)}
              style={{ marginLeft: "auto" }}
            >
              Copy HEX
            </button>
          </div>
        )}

        {/* TOOL CONTROLS & SLIDERS */}
        {imgSrc && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.5rem" }}>

            {/* Target KB Slider */}
            {(slug.includes("compress") || slug.includes("kb") || slug.includes("mb")) && (
              <label style={{ color: "#10213a", fontWeight: "600" }}>
                Target Max File Size: <strong style={{ color: "#2563eb" }}>{targetKb} KB</strong> ({formatBytes(targetKb * 1024)})
                <input
                  type="range"
                  min="10"
                  max="2048"
                  step="10"
                  value={targetKb}
                  onChange={(e) => setTargetKb(Number(e.target.value))}
                />
              </label>
            )}

            {/* Resizing Inputs */}
            {(slug.includes("resize") || slug.includes("photo") || slug.includes("signature")) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className="input-grid">
                  <label style={{ color: "#10213a", fontWeight: "600" }}>
                    Width (px)
                    <input
                      type="number"
                      value={targetWidth}
                      onChange={(e) => {
                        const w = Number(e.target.value);
                        setTargetWidth(w);
                        if (keepAspect) setTargetHeight(Math.round(w / aspectRatio));
                      }}
                    />
                  </label>
                  <label style={{ color: "#10213a", fontWeight: "600" }}>
                    Height (px)
                    <input
                      type="number"
                      value={targetHeight}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        setTargetHeight(h);
                        if (keepAspect) setTargetWidth(Math.round(h * aspectRatio));
                      }}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <label className="checkbox-label" style={{ color: "#10213a", fontWeight: "500" }}>
                    <input type="checkbox" checked={keepAspect} onChange={(e) => setKeepAspect(e.target.checked)} />
                    Lock Aspect Ratio
                  </label>
                  <button type="button" className="secondary" onClick={() => { setTargetWidth(413); setTargetHeight(531); }}>
                    Passport Preset (413×531)
                  </button>
                  <button type="button" className="secondary" onClick={() => { setTargetWidth(300); setTargetHeight(150); }}>
                    Signature Preset (300×150)
                  </button>
                </div>
              </div>
            )}

            {/* Rotation & Flip Controls */}
            {(slug.includes("rotate") || slug.includes("flip") || slug.includes("crop")) && (
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <label style={{ color: "#10213a", fontWeight: "600" }}>Rotation:</label>
                {[0, 90, 180, 270].map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    className={rotation === deg ? "" : "secondary"}
                    onClick={() => setRotation(deg)}
                  >
                    ↻ {deg}°
                  </button>
                ))}
                <button type="button" className={flipH ? "" : "secondary"} onClick={() => setFlipH(!flipH)}>
                  ↔ Flip Horizontal
                </button>
                <button type="button" className={flipV ? "" : "secondary"} onClick={() => setFlipV(!flipV)}>
                  ↕ Flip Vertical
                </button>
              </div>
            )}

            {/* Quality Slider for Converters */}
            {!slug.includes("compress") && !slug.includes("kb") && (
              <label style={{ color: "#10213a", fontWeight: "600" }}>
                Quality: {quality}%
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                />
              </label>
            )}

            {/* Target Format Selector */}
            {slug.includes("converter") && (
              <label style={{ color: "#10213a", fontWeight: "600" }}>
                Target Image Format:
                <select value={targetFormat} onChange={(e) => setTargetFormat(e.target.value as any)}>
                  <option value="image/jpeg">JPEG (.jpg)</option>
                  <option value="image/png">PNG (.png)</option>
                  <option value="image/webp">WEBP (.webp)</option>
                </select>
              </label>
            )}
          </div>
        )}

        {/* Process Action Button */}
        <button type="button" onClick={processImage} disabled={busy || !file} style={{ alignSelf: "flex-start" }}>
          {busy ? "Processing Image…" : `Run ${tool.name}`}
        </button>

        {/* RESULT STATUS & DOWNLOAD CARD */}
        {status && (
          <div className="result" style={{ marginTop: "1.25rem", padding: "1.25rem", borderRadius: "12px" }}>
            <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Result Status</strong>
            <p style={{ margin: "0.5rem 0 1rem 0", fontWeight: "bold", color: "#10b981" }}>{status}</p>

            {base64Output && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <textarea rows={4} value={base64Output} readOnly style={{ fontFamily: "monospace", fontSize: "0.85rem" }} />
                <button className="secondary" type="button" onClick={() => navigator.clipboard.writeText(base64Output)} style={{ alignSelf: "flex-start" }}>
                  Copy Base64 String
                </button>
              </div>
            )}

            {resultUrl && (
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = resultUrl;
                  link.download = `${tool.slug}-output.${targetFormat.split("/")[1] || "jpg"}`;
                  link.click();
                }}
                style={{ background: "#10b981", color: "#ffffff", fontWeight: "bold", padding: "0.75rem 1.75rem", borderRadius: "8px", border: "none" }}
              >
                📥 Download Processed Image
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
