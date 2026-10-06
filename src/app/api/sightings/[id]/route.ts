import { getSighting } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const sighting = getSighting(id);
  if (!sighting) return Response.json({ error: "That note is not on the trail." }, { status: 404 });
  return Response.json(sighting);
}
