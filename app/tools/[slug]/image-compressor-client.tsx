"use client";

import { useState } from "react";

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageCompressorClient() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(80);
  const [result, setResult] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const compress = async () => {
    if (!file) return setError("Choose an image to compress first.");
    setBusy(true);
    setError("");
    try {
      const source = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      canvas.getContext("2d")?.drawImage(source, 0, 0);
      source.close();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality / 100),
      );
      if (!blob)
        throw new Error("Your browser could not create the compressed image.");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setResult(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not compress this image.",
      );
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `${file.name.replace(/\.[^.]+$/, "")}-compressed.jpg`;
    link.click();
  };

  return (
    <section className="workbench">
      <label className="workbench-label" htmlFor="image-upload">
        Upload image
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => {
          setFile(event.target.files?.[0] || null);
          setResult(null);
          setError("");
        }}
      />
      <label className="range-label" htmlFor="compression-quality">
        Compression quality: {quality}%
      </label>
      <input
        id="compression-quality"
        type="range"
        min="10"
        max="95"
        value={quality}
        onChange={(event) => setQuality(Number(event.target.value))}
      />
      <button onClick={compress} disabled={busy}>
        {busy ? "Compressing…" : "Compress image"}
      </button>
      {error && <p className="error-message">{error}</p>}
      {result && file && (
        <div className="result">
          <strong>Compression complete</strong>
          <p>
            {formatBytes(file.size)} → {formatBytes(result.size)} (
            {Math.max(0, Math.round((1 - result.size / file.size) * 100))}%
            smaller)
          </p>
          <img
            className="image-preview"
            src={previewUrl}
            alt="Compressed image preview"
          />
          <button className="secondary" onClick={download}>
            Download compressed image
          </button>
        </div>
      )}
      <p className="privacy-note">
        Images are compressed locally in your browser and never uploaded.
      </p>
    </section>
  );
}
