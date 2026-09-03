import { NextResponse } from "next/server";
import { tools } from "../../../lib/catalog";
import { processImage } from "../../../../server/workflows/image";
import { processMedia } from "../../../../server/workflows/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const tool = tools.find((item) => item.slug === slug);
  if (!tool)
    return NextResponse.json({ error: "Unknown tool." }, { status: 404 });
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File))
      return NextResponse.json(
        { error: "A file is required." },
        { status: 400 },
      );
    if (file.size > 100 * 1024 * 1024)
      return NextResponse.json(
        { error: "Files are limited to 100 MB." },
        { status: 413 },
      );
    const options = Object.fromEntries(
      [...form.entries()].filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    const input = Buffer.from(await file.arrayBuffer());
    const result =
      tool.category === "Image Tools"
        ? await processImage(slug, input, options)
        : tool.category === "Video Tools" || tool.category === "Audio Tools"
          ? await processMedia(slug, input, file.name, options)
          : null;
    if (!result)
      return NextResponse.json(
        { error: "This server workflow is not implemented yet." },
        { status: 501 },
      );
    if ("json" in result) return NextResponse.json(result.json);
    return new Response(new Uint8Array(result.bytes), {
      headers: {
        "Content-Type": result.type,
        "Content-Disposition": `attachment; filename="${slug}.${result.extension}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed." },
      { status: 500 },
    );
  }
}
