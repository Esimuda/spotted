import fs from "node:fs";
import path from "node:path";
import { dataDir } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{6,80}$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }
  const dir = path.join(dataDir(), "uploads");
  if (!fs.existsSync(dir)) return new Response("Not found", { status: 404 });
  const file = fs.readdirSync(dir).find((name) => name.startsWith(`${id}.`));
  if (!file) return new Response("Not found", { status: 404 });
  const buffer = fs.readFileSync(path.join(dir, file));
  const type = file.endsWith(".png") ? "image/png" : file.endsWith(".webp") ? "image/webp" : "image/jpeg";
  return new Response(buffer, {
    headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable" },
  });
}
