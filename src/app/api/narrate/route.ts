import path from "node:path";
import { speciesById } from "@/data/species";
import { dataDir, serverModelsEnabled } from "@/lib/db";
import { guideFallback, narrateWithEndpoint, narrateWithGemma } from "@/lib/identify/narrate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { speciesId?: string };
    const species = speciesById(body.speciesId ?? "");
    if (!species) return Response.json({ error: "Unknown species." }, { status: 400 });

    if (process.env.GEMMA_BASE_URL) {
      try {
        const remote = await narrateWithEndpoint(species);
        if (remote) return Response.json({ ...remote, serverModels: true });
      } catch (error) {
        console.error(error);
      }
    }

    if (!serverModelsEnabled()) {
      return Response.json({ ...guideFallback(species), serverModels: false });
    }

    const note = await narrateWithGemma(species, {
      device: "cpu",
      cacheDir: path.join(dataDir(), "models"),
    });
    return Response.json({ ...note, serverModels: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not write a trail note.";
    return Response.json({ error: message }, { status: 500 });
  }
}
