import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { processImage } from "../server/workflows/image.ts";

const input = await sharp({
  create: { width: 20, height: 20, channels: 3, background: "red" },
})
  .png()
  .toBuffer();

for (const [slug, expected] of [
  ["png-to-jpg-converter", "image/jpeg"],
  ["jpg-to-png-converter", "image/png"],
  ["png-to-webp-converter", "image/webp"],
  ["jpg-to-gif-converter", "image/gif"],
]) {
  test(`${slug} returns ${expected}`, async () => {
    const result = await processImage(slug, input, {});
    assert.equal(result.type, expected);
    assert.ok(result.bytes.length > 0);
  });
}

test("crop-image returns the requested dimensions", async () => {
  const result = await processImage("crop-image", input, {
    left: "2",
    top: "3",
    cropWidth: "10",
    cropHeight: "8",
  });
  const metadata = await sharp(result.bytes).metadata();
  assert.equal(metadata.width, 10);
  assert.equal(metadata.height, 8);
});

test("crop-image rejects a rectangle outside the source", async () => {
  await assert.rejects(
    processImage("crop-image", input, {
      left: "15",
      top: "15",
      cropWidth: "10",
      cropHeight: "10",
    }),
    /within the image dimensions/,
  );
});
