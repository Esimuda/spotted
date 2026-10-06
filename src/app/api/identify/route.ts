import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { dataDir, serverModelsEnabled } from "@/lib/db";
import { runClip } from "@/lib/identify/run-clip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!serverModelsEnabled()) {
    return Response.json(
      {
        error:
          "This host is not running the model. Use the phone engine, or set ENABLE_SERVER_MODELS=true on a machine with about 2 GB of free RAM.",
      },
      { status: 503 },
    );
  }
  let tempPath = "";
  try {
    const body = (await request.json()) as { image?: string };
    const image = body.image ?? "";
    const match = image.match(/^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!match) return Response.json({ error: "Send a JPEG or PNG data URL." }, { status: 400 });
    const buffer = Buffer.from(match[1], "base64");
    if (buffer.length < 32 || buffer.length > 1_800_000) {
      return Response.json({ error: "That photo is too large." }, { status: 400 });
    }
    tempPath = path.join(os.tmpdir(), `fieldnote-${crypto.randomUUID()}.jpg`);
    fs.writeFileSync(tempPath, buffer);
    const result = await runClip(tempPath, {
      device: "cpu",
      cacheDir: path.join(dataDir(), "models"),
    });
    return Response.json(result);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "The model could not name that photo.";
    return Response.json({ error: message }, { status: 500 });
  } finally {
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}
