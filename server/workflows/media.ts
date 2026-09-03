import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

const AUDIO_OUTPUT: Record<string, string> = {
  "mp3-to-wav": "wav",
  "wav-to-mp3": "mp3",
  "m4a-to-mp3": "mp3",
  "audio-converter": "mp3",
};

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    if (!ffmpegPath) return reject(new Error("FFmpeg is unavailable."));
    const process = spawn(ffmpegPath, args, { windowsHide: true });
    let error = "";
    process.stderr.on("data", (chunk) => {
      error += String(chunk);
    });
    process.on("error", reject);
    process.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(error.split("\n").slice(-8).join("\n"))),
    );
  });
}

export async function processMedia(
  slug: string,
  input: Buffer,
  originalName: string,
  options: Record<string, string>,
) {
  const audio =
    slug.includes("audio") ||
    slug.includes("mp3") ||
    slug.includes("wav") ||
    slug.includes("m4a");
  const extension = audio
    ? AUDIO_OUTPUT[slug] || "mp3"
    : slug.includes("gif")
      ? "gif"
      : slug.includes("mp3")
        ? "mp3"
        : "mp4";
  const token = crypto.randomUUID();
  const inputPath = path.join(
    tmpdir(),
    `${token}-${path.basename(originalName)}`,
  );
  const outputPath = path.join(tmpdir(), `${token}-output.${extension}`);
  await writeFile(inputPath, input);
  const args = ["-y", "-i", inputPath];
  if (slug === "mute-video") args.push("-an");
  if (slug === "rotate-video") args.push("-vf", "transpose=1");
  if (slug === "flip-video") args.push("-vf", "hflip");
  if (slug === "change-video-speed")
    args.push("-filter:v", `setpts=${1 / (Number(options.speed) || 1)}*PTS`);
  if (slug.includes("compress")) args.push("-crf", options.crf || "28");
  args.push(outputPath);
  await runFfmpeg(args);
  return {
    bytes: await readFile(outputPath),
    type: audio
      ? `audio/${extension}`
      : extension === "gif"
        ? "image/gif"
        : "video/mp4",
    extension,
  };
}
