import sharp from "sharp";

function outputFormat(slug: string, sourceFormat?: string) {
  if (/(?:to-png|remove-image-background)$/.test(slug)) return "png";
  if (/to-webp/.test(slug)) return "webp";
  if (/to-gif/.test(slug)) return "gif";
  if (/to-(?:jpg|jpeg)/.test(slug)) return "jpeg";
  if (/(?:compress|passport|signature)/.test(slug)) return "jpeg";
  return sourceFormat || "png";
}

export async function processImage(
  slug: string,
  input: Buffer,
  options: Record<string, string>,
) {
  const metadata = await sharp(input).metadata();

  if (slug === "image-metadata-viewer" || slug === "image-dpi-checker") {
    return {
      json: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        density: metadata.density,
        size: input.length,
      },
    };
  }

  let pipeline = sharp(input, { animated: true });
  const width = Number(options.width);
  const height = Number(options.height);
  const quality = Math.min(95, Math.max(10, Number(options.quality) || 80));

  if (slug === "crop-image") {
    const left = Math.max(0, Number(options.left) || 0);
    const top = Math.max(0, Number(options.top) || 0);
    const cropWidth = Number(options.cropWidth);
    const cropHeight = Number(options.cropHeight);
    if (!cropWidth || !cropHeight)
      throw new Error("Crop width and height are required.");
    if (
      left + cropWidth > (metadata.width || 0) ||
      top + cropHeight > (metadata.height || 0)
    ) {
      throw new Error(
        "The crop rectangle must stay within the image dimensions.",
      );
    }
    pipeline = pipeline.extract({
      left,
      top,
      width: cropWidth,
      height: cropHeight,
    });
  }

  if (width || height) {
    pipeline = pipeline.resize({
      width: width || undefined,
      height: height || undefined,
      fit: "inside",
      withoutEnlargement: !slug.includes("upscaler"),
    });
  }
  if (slug === "flip-image") pipeline = pipeline.flop();
  if (slug === "rotate-image")
    pipeline = pipeline.rotate(Number(options.angle) || 90);
  if (slug === "remove-image-metadata") pipeline = pipeline.withMetadata({});
  if (slug === "remove-image-background") pipeline = pipeline.ensureAlpha();

  const format = outputFormat(slug, metadata.format);
  if (format === "png") {
    return {
      bytes: await pipeline.png({ compressionLevel: 9 }).toBuffer(),
      type: "image/png",
      extension: "png",
    };
  }
  if (format === "webp") {
    return {
      bytes: await pipeline.webp({ quality }).toBuffer(),
      type: "image/webp",
      extension: "webp",
    };
  }
  if (format === "gif") {
    return {
      bytes: await pipeline.gif().toBuffer(),
      type: "image/gif",
      extension: "gif",
    };
  }
  if (format === "jpeg" || slug === "image-converter") {
    return {
      bytes: await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer(),
      type: "image/jpeg",
      extension: "jpg",
    };
  }
  return {
    bytes: await pipeline.toBuffer(),
    type: `image/${metadata.format || "png"}`,
    extension: metadata.format || "png",
  };
}
