import { createSighting, type NewSightingInput } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as NewSightingInput;
    const sighting = createSighting(body);
    return Response.json(sighting, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save that note.";
    return Response.json({ error: message }, { status: 400 });
  }
}
