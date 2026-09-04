"use client";

import { useState, useRef } from "react";
import type { Tool } from "../../lib/catalog";

const acceptByCategory: Record<string, string> = {
  "Image Tools": "image/*,.svg,.heic,.heif",
  "Video Tools": "video/*,.mkv,.avi,.webm,.mov",
  "Audio Tools": "audio/*,.m4a,.wav,.mp3",
};

function formatBytes(bytes: number) {
  if (bytes <= 0) return "0 Bytes";
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ServerFileToolClient({ tool }: { tool: Tool }) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const [inputSize, setInputSize] = useState<number | null>(null);
  const [outputSize, setOutputSize] = useState<number | null>(null);

  // Image & Video Resize / Crop Parameters
  const [width, setWidth] = useState("");
  const [quality, setQuality] = useState("80");
  const [cropLeft, setCropLeft] = useState("0");
  const [cropTop, setCropTop] = useState("0");
  const [cropWidth, setCropWidth] = useState("");
  const [cropHeight, setCropHeight] = useState("");

  // Video Trimming Parameters
  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(10);
  const [duration, setDuration] = useState<number>(0);
  const [videoSpeed, setVideoSpeed] = useState("1.0");

  const [outputUrl, setOutputUrl] = useState("");
  const [outputName, setOutputName] = useState("");

  // Audio Recorder State
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Video Player Ref for Real-Time Seek & Preview
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const isAudioRecorder = tool.slug === "audio-recorder";
  const isAudioTool = tool.category === "Audio Tools";
  const isVideoTool = tool.category === "Video Tools";
  const isTrimmer = tool.slug.includes("trim") || tool.slug.includes("cut");

  // Handle Video Metadata Loaded
  const handleVideoLoaded = () => {
    if (videoRef.current) {
      const dur = Math.floor(videoRef.current.duration);
      setDuration(dur);
      if (endTime === 10 || endTime > dur) {
        setEndTime(dur);
      }
    }
  };

  // Real-Time Video Seeking Preview when Trimmer Start Time changes
  const seekVideoStart = (val: number) => {
    setStartTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const seekVideoEnd = (val: number) => {
    setEndTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setStatus("Audio recording captured successfully.");
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus("Microphone recording in progress...");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  const processFile = async () => {
    if (!file) return setStatus("Choose a file first.");
    setBusy(true);
    setStatus("");
    setOutputSize(null);
    setInputSize(file.size);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("width", width);
      form.append("quality", quality);
      form.append("left", cropLeft);
      form.append("top", cropTop);
      form.append("cropWidth", cropWidth);
      form.append("cropHeight", cropHeight);
      form.append("startTime", String(startTime));
      form.append("endTime", String(endTime));
      form.append("speed", videoSpeed);

      const response = await fetch(`/api/process/${tool.slug}`, {
        method: "POST",
        body: form,
      });
      if (!response.ok) {
        const problem = await response.json();
        throw new Error(problem.error || "Processing failed.");
      }
      if (response.headers.get("content-type")?.includes("application/json")) {
        setStatus(JSON.stringify(await response.json(), null, 2));
        return;
      }
      const blob = await response.blob();
      setOutputSize(blob.size);

      const disposition = response.headers.get("content-disposition") || "";
      const downloadedName =
        disposition.match(/filename="([^"]+)"/)?.[1] || `${tool.slug}-output`;
      const url = URL.createObjectURL(blob);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      setOutputUrl(url);
      setOutputName(downloadedName);
      setStatus(`Processed ${file.name} successfully. Review preview and download result.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Processing failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="workbench">
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Audio Recorder UI */}
        {isAudioRecorder ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "1.5rem", background: "#0f172a", borderRadius: "12px", border: "1px solid #334155" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#f8fafc" }}>
              {isRecording ? "🎙️ Recording Audio..." : "Microphone Audio Recorder"}
            </div>

            {!isRecording ? (
              <button
                type="button"
                onClick={startRecording}
                style={{ background: "#ef4444", fontSize: "1.1rem", padding: "0.85rem 2rem", borderRadius: "50px", fontWeight: "bold" }}
              >
                🔴 Start Recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                style={{ background: "#2563eb", fontSize: "1.1rem", padding: "0.85rem 2rem", borderRadius: "50px", fontWeight: "bold" }}
              >
                ⏹️ Stop Recording
              </button>
            )}

            {audioUrl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", marginTop: "1rem" }}>
                <audio controls src={audioUrl} style={{ width: "300px" }} />
                <a
                  href={audioUrl}
                  download="recorded-audio.wav"
                  style={{
                    background: "#10b981",
                    color: "#ffffff",
                    fontWeight: "bold",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                  }}
                >
                  📥 Download Audio WAV
                </a>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* File Upload Selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label className="workbench-label" htmlFor="server-file" style={{ color: "#10213a", fontWeight: "700" }}>
                Upload {tool.category.replace(" Tools", "").toLowerCase()} File
              </label>
              <input
                id="server-file"
                type="file"
                accept={acceptByCategory[tool.category]}
                onChange={(e) => {
                  const selected = e.target.files?.[0] || null;
                  setFile(selected);
                  if (selected) setInputSize(selected.size);
                  else setInputSize(null);
                  setOutputSize(null);
                }}
              />
            </div>

            {/* Selected File Details */}
            {file && (
              <div style={{ fontSize: "0.9rem", color: "#64748b", fontWeight: "600" }}>
                Selected File: <strong style={{ color: "#10213a" }}>{file.name}</strong> ({formatBytes(file.size)})
              </div>
            )}

            {/* REAL-TIME LIVE VIDEO PREVIEW PLAYER */}
            {file && isVideoTool && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", background: "#0f172a", padding: "1.25rem", borderRadius: "12px", border: "1px solid #334155" }}>
                <div style={{ color: "#cbd5e1", fontWeight: "bold", fontSize: "0.95rem" }}>
                  🎬 Live Video Preview & Scrubbing Player:
                </div>
                <video
                  ref={videoRef}
                  controls
                  src={URL.createObjectURL(file)}
                  onLoadedMetadata={handleVideoLoaded}
                  style={{ width: "100%", maxHeight: "380px", borderRadius: "8px", background: "#000000" }}
                />

                {/* Real-time Video Trimmer Scrubbers */}
                {isTrimmer && (
                  <div style={{ display: "grid", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <div className="input-grid">
                      <label style={{ color: "#cbd5e1" }}>
                        Trim Start Time: <strong style={{ color: "#38bdf8" }}>{startTime}s</strong>
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={startTime}
                          onChange={(e) => seekVideoStart(Number(e.target.value))}
                        />
                      </label>
                      <label style={{ color: "#cbd5e1" }}>
                        Trim End Time: <strong style={{ color: "#38bdf8" }}>{endTime}s</strong>
                        <input
                          type="range"
                          min="0"
                          max={duration || 100}
                          value={endTime}
                          onChange={(e) => seekVideoEnd(Number(e.target.value))}
                        />
                      </label>
                    </div>
                    <div style={{ color: "#34d399", fontSize: "0.85rem", fontWeight: "bold" }}>
                      Selected Trim Length: {Math.max(0, endTime - startTime)} seconds (From {startTime}s to {endTime}s)
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* REAL-TIME AUDIO PREVIEW PLAYER */}
            {file && isAudioTool && (
              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ color: "#10213a", fontWeight: "600", marginBottom: "0.5rem", display: "block" }}>Audio Preview Player:</label>
                <audio controls src={URL.createObjectURL(file)} style={{ width: "100%", maxWidth: "450px" }} />
              </div>
            )}

            {/* REAL-TIME IMAGE PREVIEW */}
            {file && tool.category === "Image Tools" && (
              <div className="preview-grid">
                <figure>
                  <figcaption style={{ fontWeight: "bold" }}>Original Upload</figcaption>
                  <img
                    className="image-preview"
                    src={URL.createObjectURL(file)}
                    alt="Original upload preview"
                  />
                </figure>
                {outputUrl && (
                  <figure>
                    <figcaption style={{ fontWeight: "bold" }}>Processed Result</figcaption>
                    <img
                      className="image-preview"
                      src={outputUrl}
                      alt="Processed image preview"
                    />
                  </figure>
                )}
              </div>
            )}

            {/* CROP & RESIZE CONTROLS */}
            {(tool.slug.includes("crop") || tool.slug.includes("resize")) && (
              <div className="input-grid">
                <label style={{ color: "#10213a", fontWeight: "600" }}>
                  Crop Left (px)
                  <input type="number" min="0" value={cropLeft} onChange={(e) => setCropLeft(e.target.value)} />
                </label>
                <label style={{ color: "#10213a", fontWeight: "600" }}>
                  Crop Top (px)
                  <input type="number" min="0" value={cropTop} onChange={(e) => setCropTop(e.target.value)} />
                </label>
                <label style={{ color: "#10213a", fontWeight: "600" }}>
                  Crop / Output Width (px)
                  <input type="number" min="1" value={cropWidth || width} onChange={(e) => setCropWidth(e.target.value)} />
                </label>
                <label style={{ color: "#10213a", fontWeight: "600" }}>
                  Crop / Output Height (px)
                  <input type="number" min="1" value={cropHeight} onChange={(e) => setCropHeight(e.target.value)} />
                </label>
              </div>
            )}

            {/* QUALITY / SPEED CONTROLS */}
            {/(compress|converter|quality|m4a|mp3|wav|video)/.test(tool.slug) && (
              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                <label style={{ color: "#10213a", fontWeight: "600" }}>
                  Quality / Compression: {quality}%
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                  />
                </label>

                {isVideoTool && (
                  <label style={{ color: "#10213a", fontWeight: "600" }}>
                    Playback Speed:
                    <select value={videoSpeed} onChange={(e) => setVideoSpeed(e.target.value)}>
                      <option value="0.5">0.5x Slow Motion</option>
                      <option value="1.0">1.0x Normal Speed</option>
                      <option value="1.5">1.5x Fast</option>
                      <option value="2.0">2.0x Double Speed</option>
                    </select>
                  </label>
                )}
              </div>
            )}

            <button onClick={processFile} disabled={busy} style={{ alignSelf: "flex-start" }}>
              {busy ? "Processing File…" : `Run ${tool.name}`}
            </button>
          </>
        )}

        {/* STATUS & DOWNLOAD CARD */}
        {status && (
          <div className="result" style={{ marginTop: "1.25rem", padding: "1.25rem", borderRadius: "12px" }}>
            <strong style={{ fontSize: "1.2rem", color: "var(--text-color, #0f172a)" }}>Result Status</strong>
            <p style={{ margin: "0.5rem 0 0.75rem 0", fontWeight: "500" }}>{status}</p>

            {/* Before & After Size Badge */}
            {inputSize !== null && outputSize !== null && (
              <div
                className="size-comparison-badge"
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                  flexWrap: "wrap",
                  padding: "0.6rem 0.9rem",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  margin: "0.5rem 0 1rem 0",
                }}
              >
                <div style={{ fontSize: "0.85rem" }}>
                  <span style={{ color: "#64748b" }}>Original Size: </span>
                  <strong style={{ color: "#0f172a" }}>{formatBytes(inputSize)}</strong>
                </div>
                <span style={{ color: "#94a3b8", fontWeight: "bold" }}>➔</span>
                <div style={{ fontSize: "0.85rem" }}>
                  <span style={{ color: "#64748b" }}>Processed Size: </span>
                  <strong style={{ color: "#0f172a" }}>{formatBytes(outputSize)}</strong>
                </div>
                <div
                  style={{
                    padding: "0.25rem 0.6rem",
                    borderRadius: "16px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                    background: outputSize <= inputSize ? "#dcfce7" : "#e0f2fe",
                    color: outputSize <= inputSize ? "#15803d" : "#0369a1",
                  }}
                >
                  {outputSize <= inputSize
                    ? `📉 ${((1 - outputSize / inputSize) * 100).toFixed(1)}% Smaller`
                    : `📈 +${(((outputSize - inputSize) / inputSize) * 100).toFixed(1)}%`}
                </div>
              </div>
            )}

            {outputUrl && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {isVideoTool && (
                  <video controls src={outputUrl} style={{ width: "100%", maxHeight: "380px", borderRadius: "8px" }} />
                )}
                <button
                  className="secondary"
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = outputUrl;
                    link.download = outputName;
                    link.click();
                  }}
                  style={{ alignSelf: "flex-start", background: "#10b981", color: "#ffffff", fontWeight: "bold" }}
                >
                  📥 Download Processed Result
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
